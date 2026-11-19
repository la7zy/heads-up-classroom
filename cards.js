// Heads Up deck for the Elementary class (ages 10-13, A1-A2).
// Built from the class's own material: weekly tests 1-5, Test Week 3/4,
// the grammar drills and auctions, Speaking Bingo 4-5, Question Builder
// Bingo 3, the vocabulary scrambles, the Question Circle stories, the
// listening scenes and the letters unit. Words follow that material
// (American spelling, "football", "TV", "school bag").
// Each card is [word, picture]. A third value of 1 marks a word that is NOT
// in their material: an easy everyday extra, hidden by the
// "only words from their lessons" switch.
// No war, prison, court or violence words; no Doha or Qatar.
window.HU_CARDS = [
  {
    key: 'animals', name: 'Animals', field: '#2E7D4F',
    cards: [
      ['elephant', '🐘'], ['giraffe', '🦒'], ['monkey', '🐒'], ['lion', '🦁'], ['tiger', '🐅'],
      ['penguin', '🐧'], ['rabbit', '🐇'], ['snake', '🐍'], ['butterfly', '🦋'], ['turtle', '🐢'],
      ['horse', '🐎'], ['owl', '🦉'], ['frog', '🐸'], ['cat', '😺'], ['dog', '🐕'],
      ['bird', '🐦'], ['fish', '🐟'], ['mouse', '🐭'], ['camel', '🐫'], ['goat', '🐐'],
      ['bear', '🐻'], ['spider', '🕷️'], ['ant', '🐜'], ['hen', '🐔'], ['fox', '🦊'],
      ['dinosaur', '🦕'], ['hamster', '🐹'],
      ['shark', '🦈', 1], ['crocodile', '🐊', 1]
    ]
  },
  {
    key: 'food', name: 'Food and drink', field: '#C8402A',
    cards: [
      ['pizza', '🍕'], ['banana', '🍌'], ['sandwich', '🥪'], ['ice cream', '🍦'], ['egg', '🥚'],
      ['carrot', '🥕'], ['bread', '🍞'], ['milk', '🥛'], ['cake', '🎂'], ['apple', '🍎'],
      ['rice', '🍚'], ['popcorn', '🍿'], ['orange', '🍊'], ['lemon', '🍋'], ['tomato', '🍅'],
      ['cherry', '🍒'], ['honey', '🍯'], ['cookie', '🍪'], ['pancake', '🥞'], ['juice', '🧃'],
      ['tea', '🍵'], ['coffee', '☕'], ['chicken', '🍗'], ['cheese', '🧀'], ['noodles', '🍜'],
      ['soup', '🍲'], ['salad', '🥗'], ['potato', '🥔'], ['chocolate', '🍫'], ['candy', '🍬'],
      ['onion', '🧅'], ['grapes', '🍇'], ['breakfast', '🍳'], ['vegetables', '🥦'],
      ['watermelon', '🍉', 1], ['hamburger', '🍔', 1]
    ]
  },
  {
    key: 'jobs', name: 'People and jobs', field: '#1E5AA8',
    cards: [
      ['firefighter', '🧑‍🚒'], ['doctor', '🩺'], ['teacher', '🧑‍🏫'], ['police officer', '🚨'], ['farmer', '🧑‍🌾'],
      ['cook', '🧑‍🍳'], ['pilot', '🧑‍✈️'], ['artist', '🧑‍🎨'], ['mechanic', '🛠️'], ['scientist', '🧑‍🔬'],
      ['singer', '🧑‍🎤'], ['dentist', '🦷'], ['builder', '👷'], ['nurse', '🧑‍⚕️'], ['baker', '🥖'],
      ['engineer', '🧑‍💻'], ['reporter', '🎙️'], ['lifeguard', '🛟'], ['actor', '🎭'], ['student', '🎓'],
      ['king', '🤴'], ['queen', '👸'], ['baby', '👶'], ['grandmother', '👵'], ['grandfather', '👴']
    ]
  },
  {
    key: 'places', name: 'Places', field: '#0B7480',
    cards: [
      ['hospital', '🏥'], ['school', '🏫'], ['beach', '🏖️'], ['airport', '🛫'], ['park', '🏞️'],
      ['bank', '🏦'], ['market', '🛒'], ['restaurant', '🍽️'], ['mountain', '🌄'], ['desert', '🏜️'],
      ['museum', '🏛️'], ['castle', '🏰'], ['library', '📚'], ['farm', '🚜'], ['house', '🏠'],
      ['garden', '🌷'], ['shop', '🏪'], ['playground', '🛝'], ['forest', '🌲'], ['bridge', '🌉'],
      ['factory', '🏭'], ['city', '🏙️'], ['office', '🏢'], ['hotel', '🏨'], ['mall', '🏬'],
      ['tent', '🏕️'], ['mosque', '🕌'], ['church', '⛪'], ['stadium', '🏟️'],
      ['island', '🏝️', 1]
    ]
  },
  {
    key: 'home', name: 'At home', field: '#9C6A06',
    cards: [
      ['bed', '🛏️'], ['chair', '🪑'], ['door', '🚪'], ['window', '🪟'], ['clock', '⏰'],
      ['key', '🔑'], ['umbrella', '☂️'], ['TV', '📺'], ['phone', '📱'],
      ['sofa', '🛋️', 1], ['toothbrush', '🪥', 1], ['mirror', '🪞', 1], ['light bulb', '💡', 1], ['bathtub', '🛁', 1]
    ]
  },
  {
    key: 'things', name: 'Everyday things', field: '#6D5034',
    cards: [
      ['ladder', '🪜'], ['trash can', '🗑️'], ['picture', '🖼️'], ['present', '🎁'], ['toy', '🧸'],
      ['glasses', '👓'], ['wallet', '👛'], ['coin', '🪙'], ['ring', '💍'], ['watch', '⌚'],
      ['battery', '🔋'], ['charger', '🔌'], ['flashlight', '🔦'], ['letter', '✉️'], ['newspaper', '📰'],
      ['hammer', '🔨'], ['magnet', '🧲'], ['radio', '📻'], ['medicine', '💊'], ['bag', '👜'],
      ['diamond', '💎'], ['stop sign', '🛑']
    ]
  },
  {
    key: 'school', name: 'School things', field: '#A3306A',
    cards: [
      ['pencil', '✏️'], ['book', '📕'], ['school bag', '🎒'], ['computer', '💻'], ['notebook', '📓'],
      ['map', '🗺️'], ['bell', '🔔'], ['pen', '🖊️'], ['printer', '🖨️'], ['computer mouse', '🖱️'],
      ['microscope', '🔬'], ['email', '📧'],
      ['scissors', '✂️', 1], ['ruler', '📏', 1], ['crayon', '🖍️', 1], ['globe', '🌍', 1], ['paintbrush', '🖌️', 1]
    ]
  },
  {
    key: 'transport', name: 'Transport', field: '#8C2F39',
    cards: [
      ['car', '🚗'], ['bicycle', '🚲'], ['airplane', '✈️'], ['truck', '🚚'], ['motorbike', '🏍️'],
      ['boat', '⛵'], ['helicopter', '🚁'], ['bus stop', '🚏'], ['traffic light', '🚦'], ['ticket', '🎟️'],
      ['suitcase', '🧳']
    ]
  },
  {
    key: 'clothes', name: 'Clothes and body', field: '#7B4B94',
    cards: [
      ['shirt', '👕'], ['coat', '🧥'], ['dress', '👗'], ['scarf', '🧣'], ['shoes', '👟'],
      ['hat', '🎩'], ['cap', '🧢'], ['pants', '👖'], ['socks', '🧦'], ['boots', '🥾'],
      ['hand', '✋'], ['feet', '🦶'], ['eyes', '👀'], ['legs', '🦵'], ['hair', '💇'],
      ['heart', '❤️'], ['brain', '🧠'], ['bone', '🦴']
    ]
  },
  {
    key: 'actions', name: 'Actions', field: '#B9560C',
    cards: [
      ['run', '🏃'], ['swim', '🏊'], ['sleep', '😴'], ['dance', '💃'], ['write', '✍️'],
      ['sing', '🎤'], ['cry', '😢'], ['laugh', '😂'], ['climb', '🧗'], ['ride a bike', '🚴'],
      ['clap', '👏'], ['think', '🤔'], ['drink', '🥤'], ['walk', '🚶'], ['read', '📖'],
      ['paint', '🎨'], ['hide', '🫣'], ['throw', '🤾'], ['smile', '😊'], ['whisper', '🤫'],
      ['wink', '😉'], ['eat', '😋'], ['wash your hands', '🧼'], ['count', '🔢'], ['look for', '🔎'],
      ['type', '⌨️'], ['juggle', '🤹'], ['exercise', '🏋️'],
      ['wave', '👋', 1]
    ]
  },
  {
    key: 'sports', name: 'Sports and fun', field: '#557A16',
    cards: [
      ['football', '⚽'], ['basketball', '🏀'], ['kite', '🪁'], ['video game', '🎮'], ['chess', '♟️'],
      ['balloon', '🎈'], ['camera', '📷'], ['volleyball', '🏐'], ['badminton', '🏸'], ['cricket', '🏏'],
      ['karate', '🥋'], ['board game', '🎲'], ['playing cards', '🃏'], ['puzzle', '🧩'], ['race', '🏁'],
      ['picnic', '🧺'], ['party', '🎉'], ['wedding', '💒'], ['goal', '🥅'], ['movie', '🎬'],
      ['tennis', '🎾', 1], ['bowling', '🎳', 1], ['skateboard', '🛹', 1], ['guitar', '🎸', 1], ['drum', '🥁', 1]
    ]
  },
  {
    key: 'nature', name: 'Weather and nature', field: '#1D74AE',
    cards: [
      ['sun', '🌞'], ['rain', '🌧️'], ['snow', '❄️'], ['rainbow', '🌈'], ['moon', '🌛'],
      ['star', '⭐'], ['tree', '🌳'], ['flower', '🌸'], ['cloud', '☁️'], ['volcano', '🌋'],
      ['fire', '🔥'], ['wind', '🌬️'], ['storm', '🌩️'], ['sea', '🌊'], ['rock', '🪨'],
      ['plant', '🌱'], ['water', '💧'], ['ice', '🧊'], ['snowman', '⛄'], ['planet', '🪐'],
      ['sunset', '🌅'], ['shell', '🐚'], ['bubbles', '🫧'], ['wheat', '🌾'], ['nest', '🪺']
    ]
  },
  {
    // From the stories they read: Katherine Johnson, Rosa Parks, Susan B. Anthony,
    // Harriet Tubman, Mansa Musa, the Wright brothers, Fleming, The BFG,
    // Diary of a Wimpy Kid, Captain Nobody, The Wooden Box and The Open Window.
    key: 'stories', name: 'Our stories', field: '#2B3A63',
    cards: [
      ['rocket', '🚀'], ['astronaut', '🧑‍🚀'], ['bus', '🚌'], ['passenger', '💺'], ['vote', '🗳️'],
      ['citizen', '🪪'], ['train', '🚂'], ['dream', '💭'], ['jar', '🫙'], ['diary', '📔'],
      ['superhero', '🦸'], ['wooden box', '📦'], ['secretary', '🧑‍💼'], ['medal', '🥇'], ['satellite', '🛰️'],
      ['crown', '👑'], ['ghost', '👻'], ['robot', '🤖'], ['trumpet', '🎺'], ['dollar bill', '💵'],
      ['germs', '🦠'], ['wing', '🪽'],
      ['telescope', '🔭', 1]
    ]
  },
  {
    key: 'funny', name: 'Just for laughs', field: '#E64980',
    // Silly things that are fun to describe and act out. Not from their lessons.
    cards: [
      ['clown', '🤡', 1], ['alien', '👽', 1], ['UFO', '🛸', 1], ['unicorn', '🦄', 1], ['dragon', '🐉', 1],
      ['T-rex', '🦖', 1], ['sloth', '🦥', 1], ['octopus', '🐙', 1], ['flamingo', '🦩', 1], ['kangaroo', '🦘', 1],
      ['skunk', '🦨', 1], ['llama', '🦙', 1], ['hedgehog', '🦔', 1], ['jellyfish', '🪼', 1], ['mosquito', '🦟', 1],
      ['sneeze', '🤧', 1], ['yawn', '🥱', 1], ['snore', '💤', 1], ['tickle', '🤣', 1], ['dizzy', '😵‍💫', 1],
      ['brain freeze', '🥶', 1], ['too spicy', '🥵', 1], ['silly face', '🤪', 1], ['upside down', '🙃', 1], ['fake mustache', '🥸', 1],
      ['cowboy', '🤠', 1], ['roller coaster', '🎢', 1], ['roller skates', '🛼', 1], ['spaghetti', '🍝', 1], ['selfie', '🤳', 1],
      ['grumpy cat', '😾', 1], ['stick out your tongue', '😛', 1], ['cover your eyes', '🙈', 1], ['parachute', '🪂', 1]
    ]
  }
];
