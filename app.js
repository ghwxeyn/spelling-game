const LISTS_KEY = "spelling-game-lists-v1";
const SELECTED_KEY = "spelling-game-selected-list-v1";
const LEGACY_KEY = "spelling-game-words-v1";
const DIFFICULTY_KEY = "spelling-game-difficulty-v1";
const ROUND_LENGTH = 10;
const WORD_SPEECH_RATE = 0.56;
const PHONICS_SPEECH_RATE = 0.44;
const PHONICS_PAUSE_MS = 300;
const normalizePronunciationText = globalThis.OpenCC?.Converter
  ? globalThis.OpenCC.Converter({ from: "tw", to: "cn" })
  : (text) => text;
const zhuyinConverterPromise = import("https://unpkg.com/pinyin-to-zhuyin@1.1.0/dist/pinyin-to-zhuyin.esm.js")
  .then(({ p2z }) => (text) => {
    if (!globalThis.pinyinPro?.pinyin) throw new Error("Pinyin converter unavailable");
    const numberedPinyin = globalThis.pinyinPro.pinyin(normalizePronunciationText(text), {
      toneType: "num",
      type: "string",
      v: true,
      nonZh: "removed",
    }).replace(/0\b/g, "5");
    return p2z(numberedPinyin, { inputHasToneMarks: false });
  })
  .catch(() => null);
const samples = [
  { word: "adventure", meaning: "冒險", zhuyin: "ㄇㄠˋ ㄒㄧㄢˇ", hint: "An exciting or unusual experience." },
  { word: "beautiful", meaning: "美麗的", zhuyin: "ㄇㄟˇ ㄌㄧˋ ˙ㄉㄜ", hint: "It starts with beau-." },
  { word: "knowledge", meaning: "知識", zhuyin: "ㄓ ㄕˋ", hint: "What you learn and understand." },
  { word: "necessary", meaning: "必要的", zhuyin: "ㄅㄧˋ ㄧㄠˋ ˙ㄉㄜ", hint: "One collar and two sleeves: one c, two s." },
  { word: "tomorrow", meaning: "明天", zhuyin: "ㄇㄧㄥˊ ㄊㄧㄢ", hint: "One m, two r." },
];
const phonicsLessonCatalog = [
  { id: "oo-long", combo: "oo", sound: "/uː/", title: "長音的 oo", tip: "嘴唇圓圓向前，聲音拉長，像 moon 裡的 oo。", narration: "O O says oo. Moon, food, room, zoo.", soundCue: "烏", soundLang: "zh-TW", examples: [["🌙", "moon", "月亮"], ["🍜", "food", "食物"], ["🚪", "room", "房間"], ["🦁", "zoo", "動物園"]] },
  { id: "oo-short", combo: "oo", sound: "/ʊ/", title: "短音的 oo", tip: "嘴唇稍微圓起，聲音短而放鬆，像 book 裡的 oo。", narration: "O O has a short sound in book. Book, foot, good, look.", soundCue: "book", examples: [["📖", "book", "書"], ["🦶", "foot", "腳"], ["👍", "good", "好的"], ["👀", "look", "看"]] },
  { combo: "er", sound: "/ɝː/、/ɚ/", title: "捲舌的 er", tip: "舌尖微微往後捲，不要碰到上顎。重音常像 bird，字尾常像 teacher。", narration: "E R uses a curled R sound. Bird, her, teacher, sister. Curl your tongue slightly back.", soundCue: "ㄦ", soundLang: "zh-TW", examples: [["🐦", "bird", "鳥"], ["👧", "her", "她"], ["🧑‍🏫", "teacher", "老師"], ["👭", "sister", "姊妹"]] },
  { combo: "sh", sound: "/ʃ/", title: "安靜的 sh", tip: "嘴唇稍微嘟起，讓氣流從中間送出，像提醒大家安靜：shhh。", narration: "S H says sh. Ship, fish, shoe, brush. Let the air flow quietly through the middle.", examples: [["🚢", "ship", "船"], ["🐟", "fish", "魚"], ["👟", "shoe", "鞋"], ["🪥", "brush", "刷子"]] },
  { combo: "ch", sound: "/tʃ/", title: "有彈力的 ch", tip: "先短暫擋住氣流，再快速放開，像小火車啟動時的聲音。", narration: "C H says ch. Chair, cheese, chicken, peach. Stop the air, then release it quickly.", examples: [["🪑", "chair", "椅子"], ["🧀", "cheese", "起司"], ["🐔", "chicken", "雞"], ["🍑", "peach", "桃子"]] },
  { combo: "th", sound: "/θ/、/ð/", title: "舌尖露出的 th", tip: "舌尖輕放在上下牙齒之間。無聲像 three，有聲像 this，喉嚨會震動。", narration: "T H has two sounds. Three, thumb. This, mother. Put your tongue gently between your teeth.", examples: [["3️⃣", "three", "三"], ["👍", "thumb", "拇指"], ["👉", "this", "這個"], ["👩", "mother", "媽媽"]] },
  { combo: "ee", sound: "/iː/", title: "微笑的長 ee", tip: "嘴角向兩側拉開，聲音拉長。兩個 e 常一起發長音。", narration: "E E says the long E sound. See, tree, green, feet. Smile and stretch the sound.", examples: [["👀", "see", "看見"], ["🌳", "tree", "樹"], ["🟢", "green", "綠色"], ["🦶", "feet", "雙腳"]] },
  { combo: "ea", sound: "/iː/、/ɛ/", title: "ea 的常見變化", tip: "多數時候像 eat 的長音；有些常用字則像 bread 的短音，要整個字一起記。", narration: "E A often says long E. Eat, sea. Sometimes it says eh. Bread, head.", examples: [["🍽️", "eat", "吃"], ["🌊", "sea", "海"], ["🍞", "bread", "麵包"], ["🙂", "head", "頭"]] },
  { combo: "ai", sound: "/eɪ/", title: "滑動的 ai", tip: "從較開的嘴型滑向微笑嘴型，通常出現在單字中間。", narration: "A I says the long A sound. Rain, train, tail, paint. Let the sound glide from A to E.", examples: [["🌧️", "rain", "雨"], ["🚆", "train", "火車"], ["🐕", "tail", "尾巴"], ["🎨", "paint", "畫畫"]] },
  { combo: "oa", sound: "/oʊ/", title: "圓嘴的 oa", tip: "從開口滑向圓唇，通常出現在單字中間。", narration: "O A says the long O sound. Boat, coat, road, soap. Finish with rounded lips.", examples: [["⛵", "boat", "船"], ["🧥", "coat", "外套"], ["🛣️", "road", "道路"], ["🧼", "soap", "肥皂"]] },
  { combo: "wh", sound: "/w/", title: "吹氣的 wh", tip: "嘴唇先圓起來，再快速張開。多數常見字裡和 w 的聲音相近。", narration: "W H usually says w. Whale, wheel, white, whisper. Round your lips, then open them.", examples: [["🐋", "whale", "鯨魚"], ["🎡", "wheel", "輪子"], ["⬜", "white", "白色"], ["🤫", "whisper", "耳語"]] },
  { combo: "ph", sound: "/f/", title: "發 f 音的 ph", tip: "上排牙齒輕碰下唇，讓氣流通過。ph 常出現在希臘語來源的字。", narration: "P H says f. Phone, photo, dolphin, elephant. Touch your top teeth to your lower lip.", examples: [["☎️", "phone", "電話"], ["📷", "photo", "照片"], ["🐬", "dolphin", "海豚"], ["🐘", "elephant", "大象"]] },
  { combo: "ng", sound: "/ŋ/", title: "鼻腔的 ng", tip: "舌根抬起，聲音從鼻腔出來。不要在尾端多加一個硬 g。", narration: "N G says ng. Sing, ring, king, wing. Keep the sound in your nose without adding a hard G.", examples: [["🎤", "sing", "唱歌"], ["💍", "ring", "戒指"], ["👑", "king", "國王"], ["🪽", "wing", "翅膀"]] },
  { combo: "nk", sound: "/ŋk/", title: "鼻音接 k 的 nk", tip: "先讓 ng 的聲音從鼻腔出來，再用舌根快速收尾成 k。", narration: "N K says ngk. Pink, bank, sink, trunk. Start in your nose, then finish with K.", examples: [["🩷", "pink", "粉紅色"], ["🏦", "bank", "銀行"], ["🚰", "sink", "水槽"], ["🧳", "trunk", "大箱子"]] },
  { combo: "ck", sound: "/k/", title: "短母音後的 ck", tip: "ck 常放在短母音後面的字尾，兩個字母合發一個清楚的 k 音。", narration: "C K says k after a short vowel. Duck, sock, clock, neck. Two letters make one sound.", examples: [["🦆", "duck", "鴨子"], ["🧦", "sock", "襪子"], ["🕒", "clock", "時鐘"], ["🧣", "neck", "脖子"]] },
  { combo: "qu", sound: "/kw/", title: "一起出現的 qu", tip: "先發 k，再立刻圓唇發 w。英文裡 q 後面通常跟著 u。", narration: "Q U usually says kw. Queen, quiz, quiet, quilt. Say k, then quickly round your lips for w.", examples: [["👸", "queen", "女王"], ["❓", "quiz", "小考"], ["🤫", "quiet", "安靜"], ["🛏️", "quilt", "棉被"]] },
  { combo: "tr", sound: "/tr/", title: "快速連讀的 tr", tip: "舌尖先抵住上齒齦作發 /t/ 的預備動作，接著舌頭微縮、聲帶不震動，快速接上捲舌的 /r/ 音，聽起來很像中文的「ㄔ」。", narration: "T R blends t and r. Tree, train, truck, trip. Say t, then move straight into R.", soundCue: "ㄔ", soundLang: "zh-TW", examples: [["🌳", "tree", "樹"], ["🚆", "train", "火車"], ["🛻", "truck", "卡車"], ["🧳", "trip", "旅行"]] },
  { combo: "kn", sound: "/n/", title: "k 不發音的 kn", tip: "出現在字首時，k 通常不發音，只留下 n 的聲音。", narration: "At the beginning of a word, K N says n. Knee, knife, knot, knock. The K is silent.", examples: [["🦵", "knee", "膝蓋"], ["🔪", "knife", "刀子"], ["🪢", "knot", "繩結"], ["🚪", "knock", "敲門"]] },
  { combo: "wr", sound: "/r/", title: "w 不發音的 wr", tip: "出現在字首時，w 通常不發音，直接發美式 r 音。", narration: "At the beginning of a word, W R says r. Write, wrist, wrap, wrong. The W is silent.", examples: [["✍️", "write", "書寫"], ["⌚", "wrist", "手腕"], ["🎁", "wrap", "包裝"], ["❌", "wrong", "錯誤"]] },
  { combo: "mb", sound: "/m/", title: "b 不發音的 mb", tip: "mb 出現在字尾時，b 通常保持安靜，只發前面的 m。", narration: "At the end of a word, M B says m. Lamb, comb, thumb, climb. The B is silent.", examples: [["🐑", "lamb", "小羊"], ["🪮", "comb", "梳子"], ["👍", "thumb", "拇指"], ["🧗", "climb", "攀爬"]] },
  { combo: "ay", sound: "/eɪ/", title: "字尾常見的 ay", tip: "ay 常出現在單字或音節尾端，發長 a 音。", narration: "A Y says long A, often at the end. Day, play, tray, gray.", examples: [["☀️", "day", "白天"], ["⚽", "play", "玩"], ["🍽️", "tray", "托盤"], ["🩶", "gray", "灰色"]] },
  { combo: "a_e", sound: "/eɪ/", title: "神奇 e：長 a", tip: "尾端 e 通常不發音，卻讓前面的 a 唸成字母名稱。", narration: "Silent E makes A say its name. Cake, game, lake, plane. The final E is quiet.", examples: [["🍰", "cake", "蛋糕"], ["🎮", "game", "遊戲"], ["🏞️", "lake", "湖"], ["✈️", "plane", "飛機"]] },
  { combo: "i_e", sound: "/aɪ/", title: "神奇 e：長 i", tip: "尾端 e 不發音，讓前面的 i 發長音 /aɪ/。", narration: "Silent E makes I say its name. Bike, kite, five, smile.", examples: [["🚲", "bike", "腳踏車"], ["🪁", "kite", "風箏"], ["5️⃣", "five", "五"], ["😊", "smile", "微笑"]] },
  { combo: "o_e", sound: "/oʊ/", title: "神奇 e：長 o", tip: "尾端 e 不發音，讓前面的 o 從開口滑向圓唇。", narration: "Silent E makes O say its name. Home, nose, rope, stone.", examples: [["🏠", "home", "家"], ["👃", "nose", "鼻子"], ["🪢", "rope", "繩子"], ["🪨", "stone", "石頭"]] },
  { combo: "u_e", sound: "/juː/、/uː/", title: "神奇 e：長 u", tip: "長 u 可能像 cube 的 /juː/，也可能像 flute 的 /uː/。", narration: "Silent E makes U long. Cube, tube, flute, rule. Listen for yoo or oo.", examples: [["🧊", "cube", "立方體"], ["🧴", "tube", "管子"], ["🪈", "flute", "長笛"], ["📏", "rule", "規則"]] },
  { combo: "igh", sound: "/aɪ/", title: "三個字母的 igh", tip: "igh 合在一起常發長 i 音，gh 在這組拼法裡不另外發音。", narration: "I G H says long I. Light, night, high, right. Three letters make one sound.", examples: [["💡", "light", "光"], ["🌙", "night", "夜晚"], ["⬆️", "high", "高"], ["➡️", "right", "右邊"]] },
  { combo: "ie", sound: "/aɪ/、/iː/", title: "ie 的兩種常見音", tip: "ie 可能像 pie 的長 i，也可能像 field 的長 e，要搭配整個字記憶。", narration: "I E can say long I or long E. Pie, tie. Field, chief.", examples: [["🥧", "pie", "派"], ["👔", "tie", "領帶"], ["🌾", "field", "田野"], ["🪶", "chief", "首領"]] },
  { combo: "ey", sound: "/iː/、/eɪ/", title: "ey 的兩種常見音", tip: "字尾 ey 常像 key 的長 e，也可能像 they 的長 a。", narration: "E Y can say long E or long A. Key, monkey. They, grey.", examples: [["🔑", "key", "鑰匙"], ["🐒", "monkey", "猴子"], ["👥", "they", "他們"], ["🩶", "grey", "灰色"]] },
  { combo: "y", sound: "/aɪ/、/iː/、/ɪ/", title: "當母音使用的 y", tip: "y 沒有站在字首時常扮演母音：my、happy、gym 分別是三種常見聲音。", narration: "Y can be a vowel. My and cry. Happy and candy. Gym has a short I sound.", examples: [["🙋", "my", "我的"], ["😭", "cry", "哭"], ["😊", "happy", "快樂"], ["🏋️", "gym", "健身房"]] },
  { combo: "ow", sound: "/aʊ/、/oʊ/", title: "ow 的兩種滑音", tip: "ow 可能像 cow 的 /aʊ/，也可能像 snow 的長 o。", narration: "O W has two common sounds. Cow, brown. Snow, window.", examples: [["🐄", "cow", "乳牛"], ["🟤", "brown", "棕色"], ["❄️", "snow", "雪"], ["🪟", "window", "窗戶"]] },
  { combo: "ou", sound: "/aʊ/", title: "張嘴再圓唇的 ou", tip: "從較開的嘴型快速滑向圓唇，常見聲音和 cow 裡的 ow 相同。", narration: "O U often says ow. House, mouse, cloud, mouth. Open, then round your lips.", examples: [["🏠", "house", "房子"], ["🐭", "mouse", "老鼠"], ["☁️", "cloud", "雲"], ["👄", "mouth", "嘴巴"]] },
  { combo: "oi", sound: "/ɔɪ/", title: "單字中間的 oi", tip: "從圓唇的 o 滑向微笑的 i，oi 常出現在單字中間。", narration: "O I says oy, often in the middle. Coin, soil, point, boil.", examples: [["🪙", "coin", "硬幣"], ["🪴", "soil", "土壤"], ["☝️", "point", "指向"], ["♨️", "boil", "煮沸"]] },
  { combo: "oy", sound: "/ɔɪ/", title: "字尾常見的 oy", tip: "聲音和 oi 相同，但 oy 常放在單字或音節尾端。", narration: "O Y says oy, often at the end. Boy, toy, joy, enjoy.", examples: [["👦", "boy", "男孩"], ["🧸", "toy", "玩具"], ["😄", "joy", "喜悅"], ["🎉", "enjoy", "享受"]] },
  { combo: "aw", sound: "/ɔː/", title: "張口的 aw", tip: "嘴巴放鬆張開，舌頭放低；美式發音中常是較長的 aw 音。", narration: "A W says aw. Saw, paw, draw, yawn. Relax your jaw and open your mouth.", examples: [["🪚", "saw", "鋸子"], ["🐾", "paw", "腳掌"], ["✏️", "draw", "畫"], ["🥱", "yawn", "打哈欠"]] },
  { combo: "au", sound: "/ɔː/", title: "單字中間的 au", tip: "au 常出現在單字中間，聲音通常和 aw 相近。", narration: "A U often says aw. August, sauce, pause, launch.", examples: [["📅", "August", "八月"], ["🥫", "sauce", "醬汁"], ["⏸️", "pause", "暫停"], ["🚀", "launch", "發射"]] },
  { combo: "ar", sound: "/ɑr/", title: "海盜音 ar", tip: "嘴巴張開後接美式捲舌 r，像海盜說 arrr。", narration: "A R says ar. Car, star, farm, shark. Open wide, then curl into R.", examples: [["🚗", "car", "汽車"], ["⭐", "star", "星星"], ["🚜", "farm", "農場"], ["🦈", "shark", "鯊魚"]] },
  { combo: "or", sound: "/ɔr/", title: "圓唇捲舌的 or", tip: "先圓唇發 o，再接美式 r。", narration: "O R says or. Fork, horse, corn, storm. Round your lips, then curl into R.", examples: [["🍴", "fork", "叉子"], ["🐴", "horse", "馬"], ["🌽", "corn", "玉米"], ["⛈️", "storm", "暴風雨"]] },
  { combo: "ir", sound: "/ɝː/", title: "捲舌母音 ir", tip: "ir 常和 er、ur 發相近的美式捲舌音，要看拼字記憶。", narration: "I R often says er. Bird, girl, shirt, first. Hold the curled R sound.", soundCue: "ㄦ", soundLang: "zh-TW", examples: [["🐦", "bird", "鳥"], ["👧", "girl", "女孩"], ["👕", "shirt", "襯衫"], ["🥇", "first", "第一"]] },
  { combo: "ur", sound: "/ɝː/", title: "捲舌母音 ur", tip: "ur 的常見聲音和 bird 裡的 ir 相近，舌頭保持微微後捲。", narration: "U R often says er. Turtle, purple, nurse, turn.", soundCue: "ㄦ", soundLang: "zh-TW", examples: [["🐢", "turtle", "烏龜"], ["🟣", "purple", "紫色"], ["🧑‍⚕️", "nurse", "護理師"], ["↩️", "turn", "轉彎"]] },
  { combo: "ew", sound: "/juː/、/uː/", title: "字尾常見的 ew", tip: "ew 常出現在字尾，可能像 few 的 /juː/ 或 grew 的 /uː/。", narration: "E W can say yoo or oo. Few, new. Grew, chew.", examples: [["🤏", "few", "少數"], ["✨", "new", "新的"], ["🌱", "grew", "成長了"], ["😋", "chew", "咀嚼"]] },
  { combo: "ue", sound: "/uː/", title: "字尾的 ue", tip: "ue 常在字尾發長 oo 音，最後的 e 不另外發音。", narration: "U E often says oo at the end. Blue, glue, true, clue.", examples: [["🔵", "blue", "藍色"], ["🧴", "glue", "膠水"], ["✅", "true", "真的"], ["🔍", "clue", "線索"]] },
  { combo: "oe", sound: "/oʊ/", title: "字尾常見的 oe", tip: "oe 合在一起常發長 o 音，嘴型最後收圓。", narration: "O E often says long O. Toe, hoe, doe, foe. Finish with rounded lips.", examples: [["🦶", "toe", "腳趾"], ["🧑‍🌾", "hoe", "鋤頭"], ["🦌", "doe", "母鹿"], ["⚔️", "foe", "敵人"]] },
  { combo: "air", sound: "/er/", title: "張口捲舌的 air", tip: "先發較開的 e 音，再滑入美式 r。", narration: "A I R says air. Hair, chair, pair, stairs.", examples: [["💇", "hair", "頭髮"], ["🪑", "chair", "椅子"], ["🍐", "pair", "一對"], ["🪜", "stairs", "樓梯"]] },
  { combo: "ear", sound: "/ɪr/、/er/", title: "ear 的常見變化", tip: "ear 可能像 ear 的 /ɪr/，也可能像 bear 的 /er/。", narration: "E A R has two common sounds. Ear, hear. Bear, pear.", examples: [["👂", "ear", "耳朵"], ["🎧", "hear", "聽見"], ["🐻", "bear", "熊"], ["🍐", "pear", "梨子"]] },
  { combo: "eer", sound: "/ɪr/", title: "靠近的 eer", tip: "eer 常發清楚的長 e 再滑入美式 r。", narration: "E E R says ear. Deer, cheer, peer, steer. Smile first, then curl into R.", examples: [["🦌", "deer", "鹿"], ["📣", "cheer", "歡呼"], ["👫", "peer", "同伴"], ["🚗", "steer", "操控方向"]] },
  { combo: "le", sound: "/əl/", title: "字尾音節 le", tip: "le 在許多字尾形成輕短的 /əl/ 音節，前面的子音要一起帶入。", narration: "Final L E often makes a quiet ul syllable. Apple, table, little, turtle.", examples: [["🍎", "apple", "蘋果"], ["🪑", "table", "桌子"], ["🤏", "little", "小的"], ["🐢", "turtle", "烏龜"]] },
  { combo: "tch", sound: "/tʃ/", title: "短母音後的 tch", tip: "tch 常放在短母音後的字尾，三個字母合發 ch 音。", narration: "T C H says ch after a short vowel. Watch, catch, match, kitchen.", examples: [["⌚", "watch", "手錶"], ["🥎", "catch", "接住"], ["🔥", "match", "火柴"], ["🍳", "kitchen", "廚房"]] },
  { combo: "dge", sound: "/dʒ/", title: "短母音後的 dge", tip: "dge 常在短母音後發 j 音，最後的 e 不另外發音。", narration: "D G E says j after a short vowel. Bridge, badge, edge, fridge.", examples: [["🌉", "bridge", "橋"], ["📛", "badge", "徽章"], ["📐", "edge", "邊緣"], ["🧊", "fridge", "冰箱"]] },
  { combo: "tion", sound: "/ʃən/", title: "常見字尾 tion", tip: "tion 常在多音節單字的字尾發 /ʃən/，像輕聲的「shun」。", narration: "T I O N often says shun. Station, action, nation, motion.", examples: [["🚉", "station", "車站"], ["🎬", "action", "行動"], ["🏳️", "nation", "國家"], ["💨", "motion", "移動"]] },
  { combo: "sion", sound: "/ʒən/、/ʃən/", title: "常見字尾 sion", tip: "sion 常像 vision 的 /ʒən/，有時也像 mission 的 /ʃən/。", narration: "S I O N has two common sounds. Vision, television, decision. Mission uses shun.", examples: [["👁️", "vision", "視覺"], ["📺", "television", "電視"], ["✅", "decision", "決定"], ["🎯", "mission", "任務"]] },
  { combo: "soft c", sound: "/s/", title: "e、i、y 前的 soft c", tip: "c 後面接 e、i、y 時，常改發 s 音。", narration: "C often says s before E, I, or Y. City, cent, cycle, face.", examples: [["🏙️", "city", "城市"], ["🪙", "cent", "分幣"], ["🚲", "cycle", "循環"], ["🙂", "face", "臉"]] },
  { combo: "soft g", sound: "/dʒ/", title: "e、i、y 前的 soft g", tip: "g 後面接 e、i、y 時，常發 j 音，但仍有例外字。", narration: "G often says j before E, I, or Y. Gem, giant, gym, page.", examples: [["💎", "gem", "寶石"], ["🗿", "giant", "巨人"], ["🏋️", "gym", "健身房"], ["📄", "page", "頁面"]] },
];

const phonicsGroups = [
  { id: "long-a", name: "長 A 音", sound: "/eɪ/", combos: ["ai", "ay", "a_e"] },
  { id: "long-e", name: "長 E 音", sound: "/iː/", combos: ["ee", "ea", "ey"] },
  { id: "long-i", name: "長 I 音", sound: "/aɪ/", combos: ["i_e", "igh", "ie", "y"] },
  { id: "long-o", name: "長 O 音", sound: "/oʊ/", combos: ["oa", "o_e", "oe"] },
  { id: "long-u", name: "長 U／OO 音", sound: "/uː/", combos: ["oo-long", "u_e", "ew", "ue"] },
  { id: "short-oo", name: "短 OO 音", sound: "/ʊ/", combos: ["oo-short"] },
  { id: "ow", name: "OW 滑音", sound: "/aʊ/", combos: ["ow", "ou"] },
  { id: "oy", name: "OY 滑音", sound: "/ɔɪ/", combos: ["oi", "oy"] },
  { id: "aw", name: "AW 音", sound: "/ɔː/", combos: ["aw", "au"] },
  { id: "er", name: "ER 捲舌音", sound: "/ɝː/", combos: ["er", "ir", "ur"] },
  { id: "r-vowels", name: "其他 R 控制音", sound: "R-controlled", combos: ["ar", "or", "air", "ear", "eer"] },
  { id: "ch", name: "CH 音", sound: "/tʃ/", combos: ["ch", "tch"] },
  { id: "j", name: "J 音", sound: "/dʒ/", combos: ["dge", "soft g"] },
  { id: "sh", name: "SH 音與字尾", sound: "/ʃ/", combos: ["sh", "tion", "sion"] },
  { id: "consonants", name: "其他子音組合", sound: "Consonants", combos: ["th", "wh", "ph", "ng", "nk", "ck", "qu", "tr", "soft c"] },
  { id: "silent", name: "不發音字母", sound: "Silent letters", combos: ["kn", "wr", "mb"] },
  { id: "syllables", name: "常見字尾音節", sound: "/əl/", combos: ["le"] },
];

const phonicsSoundCues = {
  ai: "A", ay: "A", a_e: "A",
  ee: "ee", ea: "ee, eh", ey: "ee, ay",
  i_e: "eye", igh: "eye", ie: "eye, ee", y: "eye, ee, ih",
  oa: "oh", o_e: "oh", oe: "oh",
  oo: "ooh", u_e: "you, ooh", ew: "you, ooh", ue: "ooh",
  ow: "ow, oh", ou: "ow", oi: "oy", oy: "oy", aw: "aw", au: "aw",
  er: "er", ir: "er", ur: "er", ar: "ar", or: "or", air: "air", ear: "ear, air", eer: "ear",
  ch: "chuh", tch: "chuh", dge: "juh", "soft g": "juh", sh: "shhh", tion: "shun", sion: "zhun, shun",
  th: "thhh, dhhh", wh: "wuh", ph: "fff", ng: "ng", nk: "ngk", ck: "kuh", qu: "kwuh", tr: "ㄔ", "soft c": "sss",
  kn: "nnn", wr: "rrr", mb: "mmm", le: "uhl",
};

const phonicsLessons = phonicsGroups.flatMap((group) => group.combos.map((combo) => ({
  ...phonicsLessonCatalog.find((lesson) => (lesson.id || lesson.combo) === combo),
  groupId: group.id,
})));

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const makeId = () => crypto.randomUUID();
const normalize = (value) => value.trim().toLowerCase();
const escapeHtml = (value) => {
  const node = document.createElement("div");
  node.textContent = value;
  return node.innerHTML;
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function loadLists() {
  const stored = readJson(LISTS_KEY, null);
  if (Array.isArray(stored) && stored.length) return stored;
  const legacyWords = readJson(LEGACY_KEY, []);
  return [{ id: makeId(), name: "我的單字", words: Array.isArray(legacyWords) ? legacyWords : [] }];
}

let lists = loadLists();
let selectedId = localStorage.getItem(SELECTED_KEY);
if (!lists.some((list) => list.id === selectedId)) selectedId = lists[0].id;
let words = activeList().words;
let current = null;
let round = 0;
let score = 0;
let streak = 0;
let attempts = 0;
let answered = false;
let deck = [];
let editingListId = null;
let pendingImage = "";
let letterTiles = [];
let selectedTileIds = [];
let advanceTimeoutId = null;
let countdownIntervalId = null;
let roundTotal = ROUND_LENGTH;
let answerHistory = [];
let originalRoundWords = [];
let zhuyinManuallyEdited = false;
let zhuyinTimerId = null;
let difficulty = localStorage.getItem(DIFFICULTY_KEY) === "easy" ? "easy" : "hard";
let answerSlots = [];
let filledAnswerIndexes = [];
let phonicsIndex = 0;
let phonicsPlaying = false;
let phonicsPauseTimeoutId = null;

function activeList() {
  return lists.find((list) => list.id === selectedId) || lists[0];
}

function persist() {
  activeList().words = words;
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  localStorage.setItem(SELECTED_KEY, selectedId);
  renderMenus();
  renderWords();
  updateAvailability();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove("show"), 2000);
}

function exportAllData() {
  const backup = {
    app: "spelling-game",
    version: 1,
    exportedAt: new Date().toISOString(),
    selectedListId: selectedId,
    lists,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `spelling-game-backup-${date}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("全部清單與圖片已匯出");
}

function parseBackup(rawText) {
  const backup = JSON.parse(rawText);
  if (backup?.app !== "spelling-game" || backup.version !== 1 || !Array.isArray(backup.lists) || !backup.lists.length) {
    throw new Error("Unsupported backup format");
  }

  const idMap = new Map();
  const importedLists = backup.lists.map((list) => {
    if (typeof list?.name !== "string" || !list.name.trim() || !Array.isArray(list.words)) {
      throw new Error("Invalid list");
    }
    const newId = makeId();
    idMap.set(list.id, newId);
    const importedWords = list.words.map((item) => {
      if (typeof item?.word !== "string" || !item.word.trim() || typeof item?.meaning !== "string" || !item.meaning.trim()) {
        throw new Error("Invalid word");
      }
      return {
        id: makeId(),
        word: item.word.trim(),
        meaning: item.meaning.trim(),
        zhuyin: typeof item.zhuyin === "string" ? item.zhuyin.trim() : "",
        hint: typeof item.hint === "string" ? item.hint.trim() : "",
        image: safeImage(item.image),
      };
    });
    return { id: newId, name: list.name.trim(), words: importedWords };
  });

  return {
    lists: importedLists,
    selectedId: idMap.get(backup.selectedListId) || importedLists[0].id,
  };
}

async function importAllData(file) {
  try {
    const imported = parseBackup(await file.text());
    const wordCount = imported.lists.reduce((total, list) => total + list.words.length, 0);
    if (!confirm(`匯入 ${imported.lists.length} 個清單、${wordCount} 個單字？\n目前資料將被取代。`)) return;

    const previousLists = lists;
    const previousSelectedId = selectedId;
    try {
      lists = imported.lists;
      selectedId = imported.selectedId;
      words = activeList().words;
      current = null;
      round = 0;
      clearAutoAdvance();
      persist();
    } catch (error) {
      lists = previousLists;
      selectedId = previousSelectedId;
      words = activeList().words;
      throw error;
    }
    resetWordForm();
    go("menus");
    showToast(`已匯入 ${imported.lists.length} 個清單與 ${wordCount} 個單字`);
  } catch (error) {
    showToast(error?.name === "QuotaExceededError" ? "裝置儲存空間不足，無法匯入圖片" : "檔案格式不正確，無法匯入");
  } finally {
    $("#importFile").value = "";
  }
}

function safeImage(value) {
  return typeof value === "string" && /^data:image\/(?:jpeg|png|webp);base64,/.test(value) ? value : "";
}

function updateImagePreview() {
  const image = safeImage(pendingImage);
  $("#imagePreview").classList.toggle("hide", !image);
  $("#imagePreviewPicture").src = image;
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const maxSide = 720;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Invalid image"));
    };
    image.src = objectUrl;
  });
}

function go(viewName) {
  if (viewName !== "practice") clearAutoAdvance();
  if (viewName !== "phonics") stopPhonics();
  $$(".tab").forEach((tab) => tab.classList.toggle("on", tab.dataset.view === viewName));
  $$(".view").forEach((view) => view.classList.toggle("on", view.id === viewName));
  if (viewName === "practice") updateAvailability();
}

function renderMenus() {
  const cards = lists.map((list) => `
    <article class="menu-card ${list.id === selectedId ? "selected" : ""}" data-id="${list.id}">
      <div class="menu-actions">
        <button class="action rename" type="button" title="重新命名">✎</button>
        <button class="action del-menu" type="button" title="刪除清單">×</button>
      </div>
      <span class="badge">${list.words.length} 個單字</span>
      <h2>${escapeHtml(list.name)}</h2>
      <p>${list.id === selectedId ? "目前選擇的練習清單" : "選擇這份清單來新增與練習單字"}</p>
      <button class="primary choose" type="button">${list.id === selectedId ? "繼續使用" : "選擇清單"}</button>
    </article>
  `).join("");
  $("#menuGrid").innerHTML = `${cards}<button id="createMenu" class="menu-card menu-create" type="button"><span><strong>＋</strong>建立新清單</span></button>`;
  $("#libraryMenuName").textContent = activeList().name;
  $("#practiceMenuName").textContent = activeList().name;
}

function selectList(id, destination = "library") {
  clearAutoAdvance();
  if (!lists.some((list) => list.id === id)) return;
  selectedId = id;
  words = activeList().words;
  current = null;
  round = 0;
  resetWordForm();
  persist();
  go(destination);
}

function openMenuDialog(id = null) {
  editingListId = id;
  const list = lists.find((item) => item.id === id);
  $("#menuDialogTitle").textContent = list ? "重新命名清單" : "建立新清單";
  $("#menuName").value = list?.name || "";
  $("#menuDialog").showModal();
  $("#menuName").focus();
}

function createList(name) {
  if (lists.some((list) => normalize(list.name) === normalize(name))) {
    showToast("已經有相同名稱的清單");
    return false;
  }
  const list = { id: makeId(), name, words: [] };
  lists.push(list);
  selectedId = list.id;
  words = list.words;
  current = null;
  round = 0;
  persist();
  go("library");
  showToast(`已建立「${name}」`);
  return true;
}

function renameList(id, name) {
  const list = lists.find((item) => item.id === id);
  if (!list) return false;
  if (name === list.name) return true;
  if (lists.some((item) => item.id !== id && normalize(item.name) === normalize(name))) {
    showToast("已經有相同名稱的清單");
    return false;
  }
  list.name = name;
  persist();
  showToast("清單已重新命名");
  return true;
}

function deleteList(id) {
  if (lists.length === 1) {
    showToast("至少要保留一個清單");
    return;
  }
  const list = lists.find((item) => item.id === id);
  if (!list || !confirm(`確定刪除「${list.name}」及其中 ${list.words.length} 個單字嗎？`)) return;
  lists = lists.filter((item) => item.id !== id);
  if (selectedId === id) selectedId = lists[0].id;
  words = activeList().words;
  current = null;
  round = 0;
  persist();
  showToast("清單已刪除");
}

function renderWords() {
  const query = normalize($("#search").value);
  const filtered = words.filter((item) => normalize(item.word).includes(query) || normalize(item.meaning).includes(query) || normalize(item.zhuyin || "").includes(query));
  $("#count").textContent = words.length;
  $("#empty").classList.toggle("hide", words.length > 0);
  $("#clear").disabled = !words.length;
  $("#libraryMenuName").textContent = activeList().name;
  $("#practiceMenuName").textContent = activeList().name;
  $("#wordList").innerHTML = filtered.map((item) => {
    const image = safeImage(item.image);
    return `
    <article class="word" data-id="${item.id}">
      <div class="${image ? "word-main" : ""}">${image ? `<img class="word-thumb" src="${image}" alt="">` : ""}<div><h3>${escapeHtml(item.word)}</h3><div class="meaning">${escapeHtml(item.meaning)}${item.zhuyin ? `<span class="zhuyin">${escapeHtml(item.zhuyin)}</span>` : ""}</div>${item.hint ? `<p class="hint">${escapeHtml(item.hint)}</p>` : ""}</div></div>
      <div class="actions"><button class="action hear" title="播放發音">▶</button><button class="action edit" title="編輯">✎</button><button class="action del" title="刪除">×</button></div>
    </article>
  `;
  }).join("");
}

function resetWordForm() {
  $("#wordForm").reset();
  clearTimeout(zhuyinTimerId);
  zhuyinManuallyEdited = false;
  pendingImage = "";
  updateImagePreview();
  $("#editId").value = "";
  $("#formTitle").textContent = "新增單字";
  $("#saveText").textContent = "加入單字庫";
  $("#cancel").classList.add("hide");
}

async function generateZhuyin(force = false, notifyOnFailure = false) {
  const meaning = $("#meaning").value.trim();
  if (!meaning || (!force && zhuyinManuallyEdited)) return "";
  const converter = await zhuyinConverterPromise;
  if (!converter) {
    if (notifyOnFailure) showToast("目前無法自動產生，請手動輸入注音");
    return "";
  }
  const generated = converter(meaning);
  if ($("#meaning").value.trim() !== meaning) return "";
  $("#zhuyin").value = generated;
  zhuyinManuallyEdited = false;
  return generated;
}

function scheduleZhuyinGeneration() {
  clearTimeout(zhuyinTimerId);
  if (zhuyinManuallyEdited) return;
  zhuyinTimerId = setTimeout(() => generateZhuyin(), 250);
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    showToast("瀏覽器不支援語音");
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = WORD_SPEECH_RATE;
  speechSynthesis.speak(utterance);
}

function getActivePhonicsGroup() {
  return phonicsGroups.find((group) => group.id === phonicsLessons[phonicsIndex].groupId);
}

function getActivePhonicsIndexes() {
  const group = getActivePhonicsGroup();
  return phonicsLessons.reduce((indexes, lesson, index) => {
    if (lesson.groupId === group.id) indexes.push(index);
    return indexes;
  }, []);
}

function renderPhonics() {
  const lesson = phonicsLessons[phonicsIndex];
  const group = getActivePhonicsGroup();
  const groupIndexes = getActivePhonicsIndexes();
  const groupPosition = groupIndexes.indexOf(phonicsIndex);
  $("#phonicsScene").innerHTML = `
    <div class="phonics-symbol"><div><strong>${escapeHtml(lesson.combo)}</strong><span>${escapeHtml(lesson.sound)}</span></div></div>
    <div class="phonics-copy"><p class="eyebrow">${escapeHtml(group.name)} · 短影片 ${groupPosition + 1} / ${groupIndexes.length}</p><h2>${escapeHtml(lesson.title)}</h2><p class="phonics-tip">${escapeHtml(lesson.tip)}</p><div class="phonics-examples">${lesson.examples.map(([picture, word, meaning]) => `<button class="phonics-word" type="button" data-word="${escapeHtml(word)}"><span class="picture">${picture}</span><span><strong>${escapeHtml(word)}</strong><small>${escapeHtml(meaning)}</small></span></button>`).join("")}</div></div>
  `;
  $("#phonicsProgress").style.width = `${(groupPosition + 1) / groupIndexes.length * 100}%`;
  $("#phonicsCounter").textContent = `${group.name} ${group.sound} · ${groupPosition + 1} / ${groupIndexes.length} 部短影片`;
  $("#phonicsCategories").innerHTML = phonicsGroups.map((item) => `<button class="phonics-category ${item.id === group.id ? "on" : ""}" type="button" data-group="${item.id}"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.sound)}</span></button>`).join("");
  $("#phonicsStrip").innerHTML = groupIndexes.map((index) => {
    const item = phonicsLessons[index];
    return `<button class="phonics-jump ${index === phonicsIndex ? "on" : ""}" type="button" data-index="${index}" aria-label="播放 ${escapeHtml(item.combo)} 短影片">${escapeHtml(item.combo)}</button>`;
  }).join("");
}

function stopPhonics() {
  phonicsPlaying = false;
  clearTimeout(phonicsPauseTimeoutId);
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if ($("#phonicsPlay")) $("#phonicsPlay").textContent = "▶ 播放短影片";
}

function buildPhonicsSegments(lesson) {
  const letters = lesson.combo.includes("_")
    ? lesson.combo.toUpperCase().replace("_", " silent ")
    : lesson.combo.includes(" ")
      ? lesson.combo
      : lesson.combo.toUpperCase().split("").join(" ");
  const sound = lesson.soundCue || phonicsSoundCues[lesson.combo];
  const words = lesson.examples.map(([, word]) => word).join(", ");
  return [
    [letters, letters].join(" "),
    [sound, sound, sound].join(", "),
    words,
  ];
}

function playPhonicsLesson() {
  if (!("speechSynthesis" in window)) return showToast("瀏覽器不支援語音");
  clearTimeout(phonicsPauseTimeoutId);
  speechSynthesis.cancel();
  phonicsPlaying = true;
  $("#phonicsPlay").textContent = "■ 停止短影片";
  const lesson = phonicsLessons[phonicsIndex];
  const segments = buildPhonicsSegments(lesson);

  const speakSegment = (index) => {
    if (!phonicsPlaying) return;
    const utterance = new SpeechSynthesisUtterance(segments[index]);
    utterance.lang = index === 1 && lesson.soundLang ? lesson.soundLang : "en-US";
    utterance.rate = PHONICS_SPEECH_RATE;
    utterance.onend = () => {
      if (!phonicsPlaying) return;
      if (index < segments.length - 1) {
        if (index === 0) speakSegment(index + 1);
        else phonicsPauseTimeoutId = setTimeout(() => speakSegment(index + 1), PHONICS_PAUSE_MS);
        return;
      }
      phonicsPlaying = false;
      $("#phonicsPlay").textContent = "▶ 再播一次";
    };
    speechSynthesis.speak(utterance);
  };

  speakSegment(0);
}

function showPhonicsLesson(index) {
  stopPhonics();
  phonicsIndex = (index + phonicsLessons.length) % phonicsLessons.length;
  renderPhonics();
}

function movePhonicsLesson(direction) {
  const groupIndexes = getActivePhonicsIndexes();
  const currentPosition = groupIndexes.indexOf(phonicsIndex);
  const nextPosition = (currentPosition + direction + groupIndexes.length) % groupIndexes.length;
  showPhonicsLesson(groupIndexes[nextPosition]);
}

function updateAvailability() {
  const available = words.length > 0;
  $("#practiceEmpty").classList.toggle("hide", available);
  if (!available) {
    $("#game").classList.add("hide");
    $("#complete").classList.add("hide");
  } else if (!current && round === 0) {
    startRound();
  }
}

function startRound() {
  const questions = [];
  while (questions.length < ROUND_LENGTH) questions.push(...[...words].sort(() => Math.random() - 0.5));
  originalRoundWords = questions.slice(0, ROUND_LENGTH);
  beginRound(originalRoundWords);
}

function beginRound(questions) {
  clearAutoAdvance();
  round = score = streak = attempts = 0;
  answerHistory = [];
  deck = [...questions];
  roundTotal = deck.length;
  $("#complete").classList.add("hide");
  $("#answerReview").classList.add("hide");
  $("#showAnswerReview").textContent = "列出所有答過的答案";
  $("#game").classList.remove("hide");
  nextQuestion();
}

function retryWrongAnswers() {
  const wrongQuestions = answerHistory.filter((result) => !result.correct).map((result) => result.question);
  if (!wrongQuestions.length) {
    showToast("這一輪沒有答錯的題目");
    return;
  }
  beginRound(wrongQuestions);
}

function replayOriginalRound() {
  beginRound(originalRoundWords.length ? originalRoundWords : deck);
}

function updateScoreboard() {
  $("#score").textContent = score;
  $("#streak").textContent = streak;
  $("#accuracy").textContent = attempts ? `${Math.round(score / attempts * 100)}%` : "--";
}

function shuffledLetters(word) {
  const letters = Array.from(word.toLowerCase()).filter((character) => !/\s/.test(character));
  for (let index = letters.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [letters[index], letters[swapIndex]] = [letters[swapIndex], letters[index]];
  }
  return letters.map((letter, index) => ({ id: index, letter }));
}

function createEasyPattern(word) {
  const letters = Array.from(word.toLowerCase());
  const availableIndexes = letters.map((letter, index) => /\s/.test(letter) ? -1 : index).filter((index) => index >= 0);
  for (let index = availableIndexes.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [availableIndexes[index], availableIndexes[swapIndex]] = [availableIndexes[swapIndex], availableIndexes[index]];
  }
  const revealCount = availableIndexes.length > 1 ? Math.max(1, Math.floor(availableIndexes.length / 2)) : 0;
  const revealedIndexes = new Set(availableIndexes.slice(0, revealCount));
  answerSlots = letters.map((letter, index) => /\s/.test(letter) || revealedIndexes.has(index) ? letter : "");
  filledAnswerIndexes = [];
  return letters.filter((letter, index) => !/\s/.test(letter) && !revealedIndexes.has(index)).join("");
}

function renderEasyAnswer() {
  $("#answer").value = answerSlots.map((letter) => letter || "_").join(" ");
}

function fillEasyLetters(text, requestedTileId = null) {
  for (const character of Array.from(text.toLowerCase()).filter((letter) => !/\s/.test(letter))) {
    const answerIndex = answerSlots.findIndex((letter) => !letter);
    if (answerIndex < 0) break;
    let tileId = requestedTileId;
    if (tileId === null) {
      const matchingTile = letterTiles.find((tile) => tile.letter === character && !selectedTileIds.includes(tile.id));
      tileId = matchingTile?.id ?? null;
    }
    answerSlots[answerIndex] = character;
    filledAnswerIndexes.push({ answerIndex, tileId });
    if (tileId !== null) selectedTileIds.push(tileId);
    requestedTileId = null;
  }
  renderEasyAnswer();
  renderLetterTiles();
}

function updateDifficultyControls() {
  $$(".difficulty-option").forEach((button) => {
    const selected = button.dataset.difficulty === difficulty;
    button.classList.toggle("on", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function renderLetterTiles() {
  $("#letterTiles").innerHTML = letterTiles.map((tile) => `
    <button class="letter-tile" type="button" data-tile-id="${tile.id}" ${answered || selectedTileIds.includes(tile.id) ? "disabled" : ""} aria-label="字母 ${escapeHtml(tile.letter)}">${escapeHtml(tile.letter)}</button>
  `).join("");
  const hasEnteredLetters = difficulty === "easy" ? filledAnswerIndexes.length > 0 : selectedTileIds.length > 0;
  $("#undoLetter").disabled = answered || !hasEnteredLetters;
}

function clearAutoAdvance() {
  clearTimeout(advanceTimeoutId);
  clearInterval(countdownIntervalId);
  advanceTimeoutId = null;
  countdownIntervalId = null;
  if ($("#next")) $("#next").textContent = "下一題 →";
}

function scheduleAutoAdvance() {
  clearAutoAdvance();
  let seconds = 3;
  $("#next").textContent = `下一題（${seconds}）→`;
  countdownIntervalId = setInterval(() => {
    seconds--;
    if (seconds > 0) $("#next").textContent = `下一題（${seconds}）→`;
  }, 1000);
  advanceTimeoutId = setTimeout(() => {
    clearAutoAdvance();
    nextQuestion();
  }, 3000);
}

function nextQuestion() {
  clearAutoAdvance();
  if (round >= roundTotal) {
    current = null;
    $("#game").classList.add("hide");
    $("#complete").classList.remove("hide");
    $("#finalScore").textContent = score;
    $("#completeTotal").textContent = `/ ${roundTotal}`;
    const scoreRate = roundTotal ? score / roundTotal : 0;
    $("#finalMessage").textContent = scoreRate >= 0.8 ? "拼得很漂亮，保持這個節奏！" : scoreRate >= 0.5 ? "越來越熟了，再挑戰一次吧。" : "慢慢來，多聽幾次就會記住。";
    $("#retryWrong").disabled = !answerHistory.some((result) => !result.correct);
    renderAnswerReview();
    return;
  }
  current = deck[round++];
  answered = false;
  const missingLetters = difficulty === "easy" ? createEasyPattern(current.word) : current.word;
  letterTiles = shuffledLetters(missingLetters);
  selectedTileIds = [];
  if (difficulty === "hard") {
    answerSlots = [];
    filledAnswerIndexes = [];
  }
  $("#round").textContent = round;
  $("#roundTotal").textContent = roundTotal;
  $("#bar").style.width = `${round / roundTotal * 100}%`;
  $("#meaningClue").textContent = current.meaning;
  $("#zhuyinClue").textContent = current.zhuyin || "";
  $("#zhuyinClue").classList.toggle("hide", !current.zhuyin);
  const image = safeImage(current.image);
  $("#practiceImage").src = image;
  $("#practiceImage").classList.toggle("hide", !image);
  $("#practiceStage").classList.toggle("has-image", Boolean(image));
  $("#answer").value = "";
  $("#answer").placeholder = difficulty === "easy" ? "填入底線中的字母" : "Type the word";
  if (difficulty === "easy") renderEasyAnswer();
  $("#answer").disabled = false;
  $("#feedback").textContent = "";
  $("#feedback").className = "feedback";
  $("#hintBox").classList.add("hide");
  $("#next").classList.add("hide");
  renderLetterTiles();
  updateScoreboard();
  $("#answer").focus();
  const spokenWord = current.word;
  setTimeout(() => {
    if (current?.word === spokenWord) speak(spokenWord);
  }, 250);
}

function resolveAnswer(correct, submittedAnswer = $("#answer").value) {
  attempts++;
  answered = true;
  answerHistory.push({
    question: current,
    word: current.word,
    meaning: current.meaning,
    zhuyin: current.zhuyin || "",
    answer: submittedAnswer.trim() || "（查看答案）",
    correct,
  });
  $("#answer").disabled = true;
  if (correct) {
    score++;
    streak++;
    $("#feedback").textContent = `答對了！${current.word}`;
    $("#feedback").className = "feedback good";
  } else {
    streak = 0;
    $("#feedback").textContent = `差一點！正確答案是 ${current.word}`;
    $("#feedback").className = "feedback bad";
  }
  $("#next").classList.remove("hide");
  renderLetterTiles();
  updateScoreboard();
  scheduleAutoAdvance();
}

function renderAnswerReview() {
  $("#answerReviewList").innerHTML = answerHistory.map((result, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(result.meaning)}${result.zhuyin ? `<span class="zhuyin">${escapeHtml(result.zhuyin)}</span>` : ""}</td>
      <td>${escapeHtml(result.word)}</td>
      <td>${escapeHtml(result.answer)}</td>
      <td class="${result.correct ? "review-correct" : "review-wrong"}">${result.correct ? "答對" : "答錯"}</td>
    </tr>
  `).join("");
}

$$(".tab").forEach((tab) => tab.addEventListener("click", () => go(tab.dataset.view)));
$$("[data-library]").forEach((button) => button.addEventListener("click", () => go("library")));

$("#phonicsPlay").addEventListener("click", () => {
  if (phonicsPlaying) stopPhonics();
  else playPhonicsLesson();
});
$("#phonicsPrevious").addEventListener("click", () => movePhonicsLesson(-1));
$("#phonicsNext").addEventListener("click", () => movePhonicsLesson(1));
$("#phonicsCategories").addEventListener("click", (event) => {
  const button = event.target.closest(".phonics-category");
  if (!button) return;
  const firstLessonIndex = phonicsLessons.findIndex((lesson) => lesson.groupId === button.dataset.group);
  showPhonicsLesson(firstLessonIndex);
});
$("#phonicsStrip").addEventListener("click", (event) => {
  const button = event.target.closest(".phonics-jump");
  if (!button) return;
  showPhonicsLesson(Number(button.dataset.index));
});
$("#phonicsScene").addEventListener("click", (event) => {
  const button = event.target.closest(".phonics-word");
  if (!button) return;
  stopPhonics();
  speak(button.dataset.word);
});

$("#menuGrid").addEventListener("click", (event) => {
  if (event.target.closest("#createMenu")) return openMenuDialog();
  const card = event.target.closest(".menu-card");
  if (!card) return;
  if (event.target.closest(".rename")) return openMenuDialog(card.dataset.id);
  if (event.target.closest(".del-menu")) return deleteList(card.dataset.id);
  if (event.target.closest(".choose")) selectList(card.dataset.id);
});

$("#menuDialogForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#menuName").value.trim();
  if (!name) return;
  const saved = editingListId ? renameList(editingListId, name) : createList(name);
  if (saved) $("#menuDialog").close();
});
$("#closeMenuDialog").addEventListener("click", () => $("#menuDialog").close());
$("#menuDialog").addEventListener("click", (event) => {
  if (event.target === $("#menuDialog")) $("#menuDialog").close();
});

$("#wordForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const word = $("#word").value.trim();
  const meaning = $("#meaning").value.trim();
  if (!$("#zhuyin").value.trim()) await generateZhuyin(true);
  const zhuyin = $("#zhuyin").value.trim();
  const hint = $("#hint").value.trim();
  const image = safeImage(pendingImage);
  const id = $("#editId").value;
  if (words.some((item) => normalize(item.word) === normalize(word) && item.id !== id)) {
    showToast("這個單字已存在於目前清單");
    return;
  }
  if (id) {
    words = words.map((item) => item.id === id ? { ...item, word, meaning, zhuyin, hint, image } : item);
    showToast("單字已更新");
  } else {
    words.unshift({ id: makeId(), word, meaning, zhuyin, hint, image });
    showToast("已加入目前清單");
  }
  current = null;
  round = 0;
  resetWordForm();
  persist();
});

$("#cancel").addEventListener("click", resetWordForm);
$("#meaning").addEventListener("input", scheduleZhuyinGeneration);
$("#zhuyin").addEventListener("input", () => {
  zhuyinManuallyEdited = Boolean($("#zhuyin").value.trim());
});
$("#generateZhuyin").addEventListener("click", async () => {
  const button = $("#generateZhuyin");
  button.disabled = true;
  button.textContent = "產生中";
  try {
    await generateZhuyin(true, true);
  } finally {
    button.disabled = false;
    button.textContent = "自動產生";
  }
});
$("#imageInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 12 * 1024 * 1024) {
    event.target.value = "";
    showToast("請選擇 12MB 以下的圖片檔");
    return;
  }
  try {
    pendingImage = await compressImage(file);
    updateImagePreview();
    showToast("圖片已加入並完成壓縮");
  } catch {
    event.target.value = "";
    showToast("無法讀取這張圖片");
  }
});
$("#removeImage").addEventListener("click", () => {
  pendingImage = "";
  $("#imageInput").value = "";
  updateImagePreview();
});
$("#search").addEventListener("input", renderWords);
$("#wordList").addEventListener("click", (event) => {
  const card = event.target.closest(".word");
  if (!card) return;
  const item = words.find((word) => word.id === card.dataset.id);
  if (event.target.closest(".hear")) speak(item.word);
  if (event.target.closest(".edit")) {
    $("#editId").value = item.id;
    $("#word").value = item.word;
    $("#meaning").value = item.meaning;
    $("#zhuyin").value = item.zhuyin || "";
    zhuyinManuallyEdited = Boolean(item.zhuyin);
    $("#hint").value = item.hint;
    pendingImage = safeImage(item.image);
    $("#imageInput").value = "";
    updateImagePreview();
    $("#formTitle").textContent = "編輯單字";
    $("#saveText").textContent = "儲存修改";
    $("#cancel").classList.remove("hide");
    $("#word").focus();
  }
  if (event.target.closest(".del") && confirm(`刪除「${item.word}」？`)) {
    words = words.filter((word) => word.id !== item.id);
    current = null;
    round = 0;
    persist();
    showToast("單字已刪除");
  }
});

$("#samples").addEventListener("click", () => {
  let added = 0;
  samples.forEach((sample) => {
    if (!words.some((item) => normalize(item.word) === normalize(sample.word))) {
      words.push({ ...sample, id: makeId() });
      added++;
    }
  });
  current = null;
  round = 0;
  persist();
  showToast(added ? `已加入 ${added} 個範例單字` : "範例已存在於目前清單");
});

$("#clear").addEventListener("click", () => {
  if (words.length && confirm(`確定清空「${activeList().name}」嗎？`)) {
    words = [];
    current = null;
    round = 0;
    persist();
    resetWordForm();
  }
});

$("#answerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const submittedAnswer = difficulty === "easy" ? answerSlots.join("") : $("#answer").value;
  if (!answered && normalize(submittedAnswer)) resolveAnswer(normalize(submittedAnswer) === normalize(current.word), submittedAnswer);
});
$("#letterTiles").addEventListener("click", (event) => {
  const tileButton = event.target.closest(".letter-tile");
  if (!tileButton || answered) return;
  const tileId = Number(tileButton.dataset.tileId);
  const tile = letterTiles.find((item) => item.id === tileId);
  if (!tile || selectedTileIds.includes(tileId)) return;
  if (difficulty === "easy") return fillEasyLetters(tile.letter, tileId);
  selectedTileIds.push(tileId);
  $("#answer").value += tile.letter;
  renderLetterTiles();
});
$("#undoLetter").addEventListener("click", () => {
  if (answered) return;
  if (difficulty === "easy") {
    const latest = filledAnswerIndexes.pop();
    if (!latest) return;
    answerSlots[latest.answerIndex] = "";
    if (latest.tileId !== null) selectedTileIds = selectedTileIds.filter((id) => id !== latest.tileId);
    renderEasyAnswer();
    return renderLetterTiles();
  }
  if (selectedTileIds.length === 0) return;
  selectedTileIds.pop();
  $("#answer").value = selectedTileIds.map((id) => letterTiles.find((tile) => tile.id === id).letter).join("");
  renderLetterTiles();
});
$("#answer").addEventListener("beforeinput", (event) => {
  if (difficulty !== "easy" || answered) return;
  event.preventDefault();
  if (event.inputType === "deleteContentBackward") return $("#undoLetter").click();
  if (event.data) fillEasyLetters(event.data);
});
$("#answer").addEventListener("paste", (event) => {
  if (difficulty !== "easy" || answered) return;
  event.preventDefault();
  fillEasyLetters(event.clipboardData.getData("text"));
});
$("#answer").addEventListener("input", () => {
  if (difficulty === "easy") return renderEasyAnswer();
  selectedTileIds = [];
  renderLetterTiles();
});
$$(".difficulty-option").forEach((button) => button.addEventListener("click", () => {
  if (difficulty === button.dataset.difficulty) return;
  difficulty = button.dataset.difficulty;
  localStorage.setItem(DIFFICULTY_KEY, difficulty);
  updateDifficultyControls();
  startRound();
}));
$("#speak").addEventListener("click", () => current && speak(current.word));
$("#showHint").addEventListener("click", () => {
  const fallback = `開頭是「${current.word[0]}」，共有 ${current.word.length} 個字母。`;
  $("#hintBox").textContent = current.hint || fallback;
  $("#hintBox").classList.remove("hide");
});
$("#reveal").addEventListener("click", () => {
  if (!answered) {
    $("#answer").value = current.word;
    resolveAnswer(false, "");
  }
});
$("#next").addEventListener("click", nextQuestion);
const restartButton = document.createElement("button");
restartButton.id = "restartRound";
restartButton.className = "secondary";
restartButton.type = "button";
restartButton.textContent = "↻ 重新開始";
restartButton.addEventListener("click", startRound);
$(".progress-row").append(restartButton);

const roundLabel = $("#round").parentElement;
roundLabel.innerHTML = '第 <strong id="round">1</strong> / <strong id="roundTotal">10</strong> 題';
$(".final span").id = "completeTotal";
$("#again").textContent = "重新玩一次";
const completionActions = document.createElement("div");
completionActions.className = "completion-actions";
completionActions.innerHTML = '<button id="retryWrong" class="primary" type="button">練習答錯的題目</button><button id="showAnswerReview" class="secondary" type="button">列出所有答過的答案</button>';
completionActions.append($("#again"));
$("#complete").append(completionActions);
const answerReview = document.createElement("div");
answerReview.id = "answerReview";
answerReview.className = "answer-review hide";
answerReview.innerHTML = '<div class="answer-review-scroll"><table><thead><tr><th>#</th><th>題目</th><th>正確答案</th><th>你的答案</th><th>結果</th></tr></thead><tbody id="answerReviewList"></tbody></table></div>';
$("#complete").append(answerReview);
const completionStyle = document.createElement("style");
completionStyle.textContent = '.completion-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:24px}.completion-actions button{min-height:48px}.answer-review{margin-top:28px;text-align:left}.answer-review-scroll{overflow-x:auto}.answer-review table{width:100%;border-collapse:collapse;background:white}.answer-review th,.answer-review td{padding:11px 12px;border:1px solid var(--line);white-space:nowrap}.answer-review th{background:var(--soft);color:var(--ink)}.review-correct{color:var(--teal);font-weight:800}.review-wrong{color:var(--coral);font-weight:800}@media(max-width:520px){.completion-actions{display:grid}.completion-actions button{width:100%}}';
document.head.append(completionStyle);

$("#retryWrong").addEventListener("click", retryWrongAnswers);
$("#showAnswerReview").addEventListener("click", () => {
  $("#answerReview").classList.toggle("hide");
  $("#showAnswerReview").textContent = $("#answerReview").classList.contains("hide") ? "列出所有答過的答案" : "收合答案列表";
});
$("#again").addEventListener("click", replayOriginalRound);

const dataStyle = document.createElement("style");
dataStyle.textContent = '.data-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px}.data-actions button{white-space:nowrap}@media(max-width:520px){.data-actions{display:grid;grid-template-columns:1fr 1fr;margin-top:18px}.data-actions button{padding-inline:10px;font-size:13px}}';
document.head.append(dataStyle);
$("#exportData").addEventListener("click", exportAllData);
$("#importData").addEventListener("click", () => $("#importFile").click());
$("#importFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) importAllData(file);
});

localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
localStorage.setItem(SELECTED_KEY, selectedId);
updateDifficultyControls();
renderPhonics();
renderMenus();
renderWords();
updateAvailability();
