// The people and posts behind the Social demo: an invented microblog called Murmur, about thirty
// accounts and a few days of their posts, with threads, quotes, polls and pictures. All fixed:
// "now" is NOW, and every count is either written here or worked out from a seed.

export const APP_NAME = "Murmur";

/** The demo's "now". Post times ("3h", "Oct 21") are measured from here, never from the clock. */
export const NOW = "2026-10-24T18:00:00Z";
const NOW_MS = Date.parse(NOW);

export const SOCIAL_BASE = "/demos/social";
export const hrefFor = {
  post: (id: string) => `${SOCIAL_BASE}/post/${id}`,
  user: (handle: string) => `${SOCIAL_BASE}/u/${handle}`,
  search: (q: string) => `${SOCIAL_BASE}/explore?q=${encodeURIComponent(q)}`,
};

export interface User {
  handle: string;
  name: string;
  bio: string;
  location?: string;
  website?: string;
  /** "2019-04" */
  joined: string;
  following: number;
  followers: number;
  verified?: boolean;
  /** An organisation or a bot, not a person */
  org?: boolean;
}

/** The account using the app */
export const ME = "robin";

export const USERS: User[] = [
  {
    handle: "robin",
    name: "Robin Achterberg",
    bio: "Front-end developer in Utrecht. Plain HTML enjoyer. Bikes, bread, board games.",
    location: "Utrecht",
    website: "robin.example.nl",
    joined: "2019-04",
    following: 214,
    followers: 1_380,
  },
  {
    handle: "ada",
    name: "Ada Okonkwo",
    bio: "Builds trains in Lisbon. Writes about timetables, rolling stock and the joy of a well-run interchange.",
    location: "Lisbon",
    website: "ada-on-rails.example.com",
    joined: "2019-03",
    following: 312,
    followers: 4_810,
    verified: true,
  },
  {
    handle: "lbrandt",
    name: "Lukas Brandt",
    bio: "Type designer. Currently drawing a grotesque with too many weights. #typography",
    location: "Leipzig",
    joined: "2021-07",
    following: 98,
    followers: 1_207,
  },
  {
    handle: "mei",
    name: "Mei Tanaka",
    bio: "Product designer. Drawing interfaces that get out of the way. Tokyo → Berlin.",
    location: "Berlin",
    website: "meitanaka.example.com",
    joined: "2018-11",
    following: 540,
    followers: 12_420,
    verified: true,
  },
  {
    handle: "samir",
    name: "Samir Haddad",
    bio: "Backend person. Postgres, queues, and the occasional outage write-up.",
    location: "Amman",
    joined: "2020-02",
    following: 180,
    followers: 3_051,
  },
  {
    handle: "hannah",
    name: "Hannah Lindqvist",
    bio: "Pastry chef at @kanelkvarn. Laminated dough is a personality.",
    location: "Stockholm",
    joined: "2017-09",
    following: 402,
    followers: 8_960,
  },
  {
    handle: "theo",
    name: "Theo Marchetti",
    bio: "Producer and Thursday-night DJ. Kitchen disco evangelist.",
    location: "Milan",
    joined: "2016-05",
    following: 733,
    followers: 21_300,
  },
  {
    handle: "grace",
    name: "Grace Mbeki",
    bio: "Astrophysicist. Looking at very old light. Views are from the southern hemisphere.",
    location: "Cape Town",
    website: "oldlight.example.org",
    joined: "2015-10",
    following: 260,
    followers: 48_200,
    verified: true,
  },
  {
    handle: "juan",
    name: "Juan Pablo Ortiz",
    bio: "Cyclist, urbanist. Streets are for people. #cycling",
    location: "Bogotá",
    joined: "2019-08",
    following: 611,
    followers: 9_140,
  },
  {
    handle: "priya",
    name: "Priya Raman",
    bio: "Accessibility lead. If it doesn't work with a keyboard, it doesn't work. #a11y",
    location: "Bengaluru",
    website: "priya.example.dev",
    joined: "2017-02",
    following: 389,
    followers: 27_650,
    verified: true,
  },
  {
    handle: "olafur",
    name: "Ólafur Sigurðsson",
    bio: "Weather nerd in Reykjavík. Posting the sky so you don't have to look up.",
    location: "Reykjavík",
    joined: "2020-12",
    following: 77,
    followers: 5_400,
  },
  {
    handle: "nora",
    name: "Nora Fitzgerald",
    bio: "Novelist. Third book out in March. Mostly here for the birds.",
    location: "Galway",
    joined: "2014-06",
    following: 902,
    followers: 15_330,
  },
  {
    handle: "kwame",
    name: "Kwame Asante",
    bio: "Photographer. Film, mostly. Accra and wherever the light is. #filmphotography",
    location: "Accra",
    joined: "2018-01",
    following: 455,
    followers: 11_090,
  },
  {
    handle: "elif",
    name: "Elif Yıldız",
    bio: "Data journalist. Charts that tell the truth, footnotes included.",
    location: "Istanbul",
    joined: "2016-03",
    following: 640,
    followers: 19_870,
    verified: true,
  },
  {
    handle: "marco",
    name: "Marco Bellini",
    bio: "Espresso, Vespa repairs, and strong opinions about pasta shapes.",
    location: "Bologna",
    joined: "2021-01",
    following: 150,
    followers: 2_210,
  },
  {
    handle: "zoe",
    name: "Zoë Martens",
    bio: "Teacher, year 6. Collecting the funniest things eleven-year-olds say.",
    location: "Ghent",
    joined: "2022-08",
    following: 233,
    followers: 6_720,
  },
  {
    handle: "ivan",
    name: "Ivan Petrov",
    bio: "Compiler engineer. Making slow things fast and fast things correct.",
    location: "Sofia",
    joined: "2017-11",
    following: 121,
    followers: 7_300,
  },
  {
    handle: "aiko",
    name: "Aiko Hayashi",
    bio: "Ceramicist. Wheel-thrown, wood-fired, slightly wonky.",
    location: "Mashiko",
    website: "aikohayashi.example.jp",
    joined: "2019-05",
    following: 310,
    followers: 13_480,
  },
  {
    handle: "devika",
    name: "Devika Shah",
    bio: "Running a tiny SaaS for bakeries. Two people, four cats.",
    location: "Leicester",
    joined: "2020-06",
    following: 520,
    followers: 4_020,
  },
  {
    handle: "tom",
    name: "Tom Ferreira",
    bio: "Climbing, maps, and long walks with a thermos.",
    location: "Porto",
    joined: "2018-07",
    following: 287,
    followers: 1_960,
  },
  {
    handle: "linnea",
    name: "Linnea Berg",
    bio: "Librarian. Ask me about the card catalogue. Seriously, ask.",
    location: "Uppsala",
    joined: "2016-09",
    following: 701,
    followers: 3_880,
  },
  {
    handle: "felix",
    name: "Felix Wagner",
    bio: "Indie game dev. Making a cozy game about a lighthouse keeper. #gamedev",
    location: "Graz",
    website: "keeper-game.example.com",
    joined: "2021-03",
    following: 410,
    followers: 8_150,
  },
  {
    handle: "amara",
    name: "Dr Amara Nwosu",
    bio: "Paediatrician. Opinions my own; handwashing mandatory.",
    location: "Manchester",
    joined: "2015-04",
    following: 199,
    followers: 33_400,
    verified: true,
  },
  {
    handle: "sofia",
    name: "Sofía Castillo",
    bio: "Translator ES/EN/PT. Collector of untranslatable words.",
    location: "Montevideo",
    joined: "2019-10",
    following: 812,
    followers: 5_610,
  },
  {
    handle: "harbourton",
    name: "Harbourton City Council",
    bio: "Official account of Harbourton City Council. Bin days, road works, and the odd heron.",
    location: "Harbourton",
    website: "harbourton.example.gov",
    joined: "2012-01",
    following: 85,
    followers: 64_300,
    verified: true,
    org: true,
  },
  {
    handle: "northlight",
    name: "Northlight Museum",
    bio: "Art, science and a very large whale skeleton. Open Tuesday to Sunday, 10 to 6.",
    location: "Harbourton",
    website: "northlight.example.org",
    joined: "2013-05",
    following: 320,
    followers: 41_200,
    verified: true,
    org: true,
  },
  {
    handle: "kanelkvarn",
    name: "Kanel & Kvarn",
    bio: "Bakery in Södermalm. Cardamom buns from 7. Gone by 11.",
    location: "Stockholm",
    joined: "2018-02",
    following: 140,
    followers: 18_900,
    org: true,
  },
  {
    handle: "marginnotes",
    name: "Margin Notes Weekly",
    bio: "A Sunday letter about books, links and small good things.",
    website: "marginnotes.example.com",
    joined: "2020-09",
    following: 60,
    followers: 22_740,
    org: true,
  },
  {
    handle: "rainbot",
    name: "Harbourton Rain Bot",
    bio: "Posts when it's about to rain in Harbourton. Usually right. A bot by @samir.",
    joined: "2021-11",
    following: 1,
    followers: 9_870,
    org: true,
  },
  {
    handle: "jules",
    name: "Jules Moreau",
    bio: "Sound engineer. Tape machines and patience.",
    location: "Lyon",
    joined: "2017-06",
    following: 266,
    followers: 3_430,
  },
  {
    handle: "ben",
    name: "Benedikt Kraus",
    bio: "Software architect, recovering. Now growing tomatoes.",
    location: "Freiburg",
    joined: "2014-12",
    following: 345,
    followers: 2_870,
  },
];

/** Accounts the listener follows, for the Following timeline */
export const FOLLOWING = ["ada", "mei", "samir", "priya", "lbrandt", "grace", "juan", "kwame", "elif", "hannah", "zoe", "felix", "harbourton", "marginnotes"];

/** Accounts that follow the listener back */
export const FOLLOWERS = ["ada", "samir", "priya", "zoe", "devika", "ben", "linnea", "felix"];

export interface Poll {
  options: { label: string; votes: number }[];
  /** "2 days left", "Final results" */
  status: string;
  /** The option the listener voted for, if any */
  voted?: number;
}

export interface PostImage {
  seed: string;
  /** What the picture shows, as alt text */
  alt: string;
  /** Width / height */
  ratio?: number;
}

export interface Post {
  id: string;
  author: string;
  /** ISO time */
  at: string;
  text: string;
  replyTo?: string;
  quoteOf?: string;
  image?: PostImage;
  poll?: Poll;
  replies: number;
  reposts: number;
  likes: number;
  views: number;
  /** The listener's own marks on it */
  liked?: boolean;
  reposted?: boolean;
  bookmarked?: boolean;
  pinned?: boolean;
}

type PostSrc = [id: string, author: string, minutesAgo: number, text: string, extra?: Partial<Omit<Post, "id" | "author" | "at" | "text">>];

// Newest last within each thread; the timeline sorts by time anyway.
const SRC: PostSrc[] = [
  // Ada's timetable thread
  [
    "ada-1",
    "ada",
    95,
    "Thread: we redrew the Linha Verde timetable from scratch this month. Four things we learned, in order of how much they surprised me. 1/4",
    { image: { seed: "timetable", alt: "A printed timetable pinned to a corkboard, half the rows highlighted in yellow", ratio: 16 / 9 } },
  ],
  [
    "ada-2",
    "ada",
    94,
    'People don\'t read departure times, they read gaps. A train every 7 minutes beats "07:03, 07:10, 07:17" every single time. We now print the gap first. 2/4',
    { replyTo: "ada-1" },
  ],
  [
    "ada-3",
    "ada",
    93,
    "The single biggest complaint wasn't frequency, it was the last train. Moving it 20 minutes later cost almost nothing and fixed half the angry emails. 3/4",
    { replyTo: "ada-2" },
  ],
  [
    "ada-4",
    "ada",
    92,
    'And: put the map next to the times. Nobody knows which direction "towards Odivelas" is unless they can see it. Full write-up here: https://ada-on-rails.example.com/linha-verde 4/4',
    { replyTo: "ada-3" },
  ],
  [
    "r-ada-1",
    "juan",
    80,
    '@ada "people read gaps" should be printed on the wall of every transit agency. Bogotá\'s bus stops are slowly getting there.',
    { replyTo: "ada-4" },
  ],
  [
    "r-ada-2",
    "robin",
    70,
    '@ada We did the same thing on a status page at work: "every 5 minutes" instead of a list of times. Support tickets dropped the next week.',
    { replyTo: "ada-4", liked: true },
  ],
  [
    "r-ada-3",
    "ada",
    66,
    "@robin Love that. Turns out humans are the same everywhere: we want to know how long we'll wait, not what the clock will say.",
    { replyTo: "r-ada-2" },
  ],
  ["r-ada-4", "elif", 60, "@ada Would you share the before/after complaint numbers? I'd love to chart them (with footnotes, obviously).", { replyTo: "ada-4" }],

  // Priya on menus
  [
    "priya-1",
    "priya",
    240,
    "Reminder that a dropdown menu needs: arrow keys, Home/End, typeahead, Escape that returns focus, and Tab that closes it. Five things. Most custom menus ship with one. #a11y",
    { liked: true, bookmarked: true },
  ],
  [
    "r-priya-1",
    "mei",
    230,
    '@priya The typeahead is the one everyone forgets. Press "D" and land on Delete is the whole point of a menu.',
    { replyTo: "priya-1" },
  ],
  [
    "r-priya-2",
    "samir",
    225,
    "@priya Genuinely asking: is a native <select> good enough for most of these cases? It gets all five for free.",
    { replyTo: "priya-1" },
  ],
  [
    "r-priya-3",
    "priya",
    220,
    "@samir For choosing a value, yes, always. For a list of actions (Edit, Duplicate, Delete) you want a menu button. Different jobs.",
    { replyTo: "r-priya-2" },
  ],
  ["r-priya-4", "robin", 215, "@priya @samir This is the clearest one-sentence version of select vs menu I've read. Bookmarking.", { replyTo: "r-priya-3" }],

  // Grace and the comet
  [
    "grace-1",
    "grace",
    310,
    "Comet C/2026 K3 is now visible to the naked eye from dark sites in the southern hemisphere. Look west about an hour after sunset, just above Venus. #astronomy",
    { image: { seed: "comet", alt: "A faint comet with a long pale tail over a dark hillside, Venus bright beneath it", ratio: 3 / 2 } },
  ],
  ["r-grace-1", "olafur", 300, "@grace Sadly we have 21 hours of cloud forecast. I will be enjoying it through your pictures.", { replyTo: "grace-1" }],
  ["r-grace-2", "kwame", 290, "@grace Shot it last night on Portra 400, 30 seconds at f/2. Developing tomorrow, fingers crossed.", { replyTo: "grace-1" }],
  ["r-grace-3", "grace", 285, "@kwame Please post it. Film comet photos are my favourite genre of photo.", { replyTo: "r-grace-2" }],
  [
    "r-grace-4",
    "zoe",
    270,
    '@grace My class wants to know if the comet has a name or just a number. They have suggestions. Most of them are "Steve".',
    { replyTo: "grace-1" },
  ],
  ["r-grace-5", "grace", 262, "@zoe Tell them it's named after the survey that found it, but Steve is canonically its nickname now.", { replyTo: "r-grace-4" }],

  // Robin's own posts
  [
    "robin-1",
    "robin",
    30,
    "Shipped a settings page today with no JavaScript framework at all: a <form>, real <fieldset>s, and a submit button. It loads in 40 ms and works with the keyboard by default. Feels like cheating.",
    { replies: 3, pinned: true },
  ],
  [
    "r-robin-1",
    "priya",
    25,
    "@robin Labels on every field? Errors next to the field they belong to? Then it's not cheating, it's just correct.",
    { replyTo: "robin-1" },
  ],
  [
    "r-robin-2",
    "robin",
    22,
    "@priya Labels everywhere, errors with aria-describedby, and the focus goes to the first error on submit. I learned from the best.",
    { replyTo: "r-robin-1" },
  ],
  ["r-robin-3", "ben", 18, "@robin The industry will spend ten years rediscovering the form element and call it a paradigm shift.", { replyTo: "robin-1" }],
  [
    "robin-2",
    "robin",
    1_500,
    "Which board game should I bring to a table of six people who've never met? Asking for a work offsite.",
    {
      poll: {
        options: [
          { label: "Codenames-style word game", votes: 412 },
          { label: "Something with trains", votes: 238 },
          { label: "Cooperative puzzle game", votes: 301 },
          { label: "Just bring snacks", votes: 177 },
        ],
        status: "Final results",
        voted: 1,
      },
    },
  ],
  [
    "robin-3",
    "robin",
    4_400,
    "Bread update: the starter (named Gerald) survived the holiday. The loaf did not survive me slicing it hot. #sourdough",
    { image: { seed: "loaf", alt: "A dark, crackly sourdough loaf on a wooden board, one slice cut too early and squashed", ratio: 4 / 3 } },
  ],

  // Mei
  [
    "mei-1",
    "mei",
    55,
    'A design review question I keep coming back to: "What does this screen look like with real data?" Not three tidy rows. Four hundred rows, a name that\'s 60 characters long, and a price in yen.',
    {},
  ],
  ["mei-2", "mei", 1_900, "Tiny joy: the new office has a window that opens. I'm told this is unusual for Berlin offices built after 2010.", {}],
  [
    "r-mei-1",
    "lbrandt",
    40,
    '@mei And then the same screen in German, where "Save" becomes "Speichern" and every button doubles in width.',
    { replyTo: "mei-1" },
  ],
  [
    "r-mei-2",
    "sofia",
    35,
    "@mei @lbrandt And in Portuguese the date format flips and someone's surname has three particles. Real data is a gift.",
    { replyTo: "r-mei-1" },
  ],

  // Lukas, typography
  [
    "lb-1",
    "lbrandt",
    130,
    "Week 14 of drawing the italic. The lowercase a has been redrawn 41 times. It is now, finally, an a. #typography",
    { image: { seed: "italic-a", alt: "Pencil sketches of the italic letter a, dozens of them, slowly getting narrower", ratio: 1 } },
  ],
  ["lb-2", "lbrandt", 3_200, "If your body text is 14px and your line height is 1.2, I can't help you, but I can tell you I tried.", {}],

  // Samir
  [
    "samir-1",
    "samir",
    180,
    "Incident write-up from Tuesday, short version: a queue consumer retried forever, every retry made one more database connection, and at 02:14 we ran out. Fix: a retry limit and a dead-letter queue. Long version: https://samir.example.dev/notes/retries",
    { liked: true },
  ],
  ["samir-2", "samir", 2_600, "Postgres tip that saved my week: EXPLAIN (ANALYZE, BUFFERS). The BUFFERS part is where the truth lives.", { bookmarked: true }],
  [
    "samir-3",
    "samir",
    6_000,
    "The rain bot has now been right 87% of the time this year, which is better than me at predicting anything.",
    { quoteOf: "rain-1" },
  ],

  // Hannah and the bakery
  [
    "hannah-1",
    "hannah",
    150,
    "Croissant cross-section of the day. 27 layers. The 28th layer was butter that escaped and I'm choosing to call it a feature.",
    { image: { seed: "croissant", alt: "A croissant cut in half showing a honeycomb of airy layers", ratio: 1 } },
  ],
  [
    "kk-1",
    "kanelkvarn",
    600,
    "Saturday special: cardamom buns with a little orange zest. We bake 400. Last week they were gone by 10:40.",
    { image: { seed: "buns", alt: "Rows of knotted cardamom buns cooling on a wire rack", ratio: 16 / 9 } },
  ],
  ["r-kk-1", "hannah", 590, "@kanelkvarn Orange zest was my idea and I will be taking all the credit.", { replyTo: "kk-1" }],
  ["r-kk-2", "devika", 520, "@kanelkvarn Every time you post these I consider moving to Stockholm.", { replyTo: "kk-1" }],

  // Theo
  [
    "theo-1",
    "theo",
    75,
    "Thursday's set list is done. 34 tracks, three key changes, one accordion solo. You will dance in the kitchen and you will like it.",
    {},
  ],
  ["theo-2", "theo", 2_000, "Hot take: every playlist should end with a slow song so people know it's time to go home.", {}],

  // Juan, cycling
  [
    "juan-1",
    "juan",
    200,
    "Sunday ciclovía numbers are in: 1.8 million people on 127 km of streets closed to cars. Every single Sunday since 1974. #cycling",
    { image: { seed: "ciclovia", alt: "A wide avenue full of cyclists, joggers and kids on scooters, no cars in sight", ratio: 16 / 9 } },
  ],
  ["juan-2", "juan", 4_000, "A protected bike lane is a lane that a nervous 12-year-old would ride in. If they wouldn't, it's paint.", { liked: true }],

  // Ólafur, weather
  [
    "olafur-1",
    "olafur",
    45,
    "The sky over Reykjavík at 15:40. The sun set at 17:22 and this is the brightest it got today.",
    { image: { seed: "reykjavik-sky", alt: "A low pink and violet sky over grey rooftops and a dark sea", ratio: 16 / 9 } },
  ],
  ["olafur-2", "olafur", 1_200, "Wind gusts of 31 m/s at the harbour this morning. I saw a man walking his dog and the dog was, briefly, flying.", {}],

  // Nora
  ["nora-1", "nora", 115, "Wrote 2,000 words today and then deleted 1,800 of them. The 200 that are left are very good, though.", {}],
  [
    "nora-2",
    "nora",
    2_300,
    "A pair of goldfinches on the feeder this morning. I stopped writing for twenty minutes to watch them. Best twenty minutes of the week.",
    { image: { seed: "goldfinch", alt: "Two goldfinches with red faces and yellow wing bars on a hanging seed feeder", ratio: 4 / 3 } },
  ],

  // Kwame
  [
    "kwame-1",
    "kwame",
    260,
    "Contact sheet from Jamestown, last week. Ilford HP5 pushed to 1600 because the light was going and I wasn't. #filmphotography",
    { image: { seed: "contact-sheet", alt: "A black and white contact sheet of fishing boats, nets and children on a harbour wall", ratio: 3 / 2 } },
  ],
  ["kwame-2", "kwame", 3_900, "Rule of thumb: if you're wondering whether to take the picture, take the picture.", {}],

  // Elif, data
  [
    "elif-1",
    "elif",
    170,
    "Do you read the footnotes on a chart?",
    {
      poll: {
        options: [
          { label: "Always", votes: 1_204 },
          { label: "Only when something looks off", votes: 2_871 },
          { label: "There are footnotes?", votes: 1_655 },
        ],
        status: "18 hours left",
      },
    },
  ],
  ["elif-2", "elif", 2_800, "A bar chart that doesn't start at zero isn't a bar chart, it's a mood.", { liked: true }],

  // Marco
  [
    "marco-1",
    "marco",
    320,
    "Settle this. Which pasta shape holds sauce best?",
    {
      poll: {
        options: [
          { label: "Rigatoni", votes: 3_410 },
          { label: "Orecchiette", votes: 1_220 },
          { label: "Fusilli", votes: 2_005 },
          { label: "Spaghetti, and I'm not sorry", votes: 980 },
        ],
        status: "2 days left",
      },
    },
  ],
  [
    "marco-2",
    "marco",
    5_100,
    "Vespa is running again. The problem was a 4 cent washer. It took me three weekends to find the 4 cent washer.",
    { image: { seed: "vespa", alt: "A pale green scooter on its stand in a narrow street, a toolbox open beside it", ratio: 4 / 3 } },
  ],

  // Zoë
  [
    "zoe-1",
    "zoe",
    140,
    'Today a pupil asked if the moon is "the same moon in Belgium as in Spain". Then another one said "no, Spain has the sun". I have no notes.',
    {},
  ],
  [
    "zoe-2",
    "zoe",
    3_000,
    "We built a weather station on the school roof. It mostly measures how windy it is when the caretaker goes up to check on it.",
    { quoteOf: "olafur-2" },
  ],

  // Ivan
  [
    "ivan-1",
    "ivan",
    210,
    "Made the parser 3.4× faster by deleting a cache. The cache was slower than the thing it was caching. This happens more often than anyone admits.",
    {},
  ],
  [
    "r-ivan-1",
    "ben",
    200,
    "@ivan The two hardest problems in computer science: cache invalidation, naming things, and admitting the cache was never needed.",
    { replyTo: "ivan-1" },
  ],

  // Aiko
  [
    "aiko-1",
    "aiko",
    380,
    "Unloaded the kiln this morning after four days of firing. Forty pots in, thirty-one came out whole. The ash glaze on this one ran exactly where I hoped.",
    { image: { seed: "ash-glaze", alt: "A squat stoneware jar with a green ash glaze that has run down one side in drips", ratio: 1 } },
  ],

  // Devika
  [
    "devika-1",
    "devika",
    480,
    "Small business milestone: 100 bakeries now use our ordering page. The first one was my aunt's, and she still reports bugs by phone at 6 am.",
    {},
  ],
  ["r-devika-1", "robin", 470, "@devika Congratulations! Aunts are the best QA team in the industry.", { replyTo: "devika-1" }],

  // Tom
  [
    "tom-1",
    "tom",
    900,
    "Peneda-Gerês today: 19 km, 1,100 m of climbing, two wild horses, one very good flask of soup.",
    { image: { seed: "geres", alt: "Granite hills under a big sky, a narrow path winding up between ferns", ratio: 16 / 9 } },
  ],

  // Linnea
  [
    "linnea-1",
    "linnea",
    560,
    "Found a book returned 41 years late today, with a bus ticket from 1985 as a bookmark. No fine. The bus ticket is going in our display case.",
    { liked: true },
  ],
  ["r-linnea-1", "nora", 540, "@linnea I need to know what the book was.", { replyTo: "linnea-1" }],
  ["r-linnea-2", "linnea", 535, "@nora A field guide to Swedish mushrooms. Hopefully they were not relying on it this whole time.", { replyTo: "r-linnea-1" }],

  // Felix
  [
    "felix-1",
    "felix",
    330,
    "New screenshot of the lighthouse game: the keeper's kitchen at night. Every object you can pick up has a little story. #gamedev",
    { image: { seed: "lighthouse-kitchen", alt: "A pixel-art kitchen inside a lighthouse, lamplight on a table with a kettle and a logbook", ratio: 16 / 9 } },
  ],
  [
    "felix-2",
    "felix",
    5_600,
    "Wishlists for the lighthouse game passed 10,000 today. I made it in a spare room with a cat on my lap. Thank you, all of you.",
    {},
  ],

  // Amara
  [
    "amara-1",
    "amara",
    420,
    "It's that time of year: if your child has a fever, the most useful thing you can do is keep them drinking. The second most useful is to write down the temperatures and times. It helps us more than you'd think.",
    {},
  ],

  // Sofía
  [
    "sofia-1",
    "sofia",
    280,
    'Untranslatable word of the week: "sobremesa" (Spanish). The time spent at the table after the meal is over, talking. English has no word for it, which explains a lot.',
    { liked: true },
  ],
  [
    "r-sofia-1",
    "marco",
    260,
    '@sofia Italian has "abbiocco": the drowsiness after a big lunch. These two words are a complete afternoon.',
    { replyTo: "sofia-1" },
  ],

  // Organisations
  [
    "harbourton-1",
    "harbourton",
    100,
    "Road works on Quay Street start Monday 26 October and run for three weeks. The bus stop moves 50 m north to outside the library. Cyclists: the contraflow lane stays open.",
    { image: { seed: "quay-street-map", alt: "A street map of Quay Street with the closed section and the moved bus stop marked", ratio: 16 / 9 } },
  ],
  [
    "harbourton-2",
    "harbourton",
    2_100,
    "The heron who lives by the harbour steps has been given a name by public vote. Welcome, officially, Gerald. #HarbourtonHeron",
    {},
  ],
  [
    "northlight-1",
    "northlight",
    360,
    "The whale is back. After 14 months of cleaning and restoration, our 21-metre fin whale skeleton returns to the main hall this Saturday. Free entry all weekend.",
    { image: { seed: "whale-hall", alt: "A long whale skeleton hanging from the ceiling of a tall hall with arched windows", ratio: 16 / 9 } },
  ],
  ["northlight-2", "northlight", 3_500, "Late opening Thursday: the night sky gallery, telescopes on the roof, and @grace talking about comets at 19:00.", {}],
  [
    "marginnotes-1",
    "marginnotes",
    1_400,
    'This Sunday: three novels about islands, a very good essay about the history of the paperclip, and a recipe for soup that one reader calls "aggressively comforting". https://marginnotes.example.com/issue-212',
    {},
  ],
  ["rain-1", "rainbot", 20, "Rain likely in Harbourton in the next 30 minutes. Light at first, heavier by 18:45. Bring the washing in.", {}],
  ["rain-2", "rainbot", 1_700, "Rain likely in Harbourton in the next 30 minutes. Heavy, with gusts. The heron has already gone home.", {}],

  // Jules
  [
    "jules-1",
    "jules",
    640,
    "Aligned a 1979 tape machine today. Three hours with a test tape and a tiny screwdriver. The hiss is now perfectly centred, which is the most a hiss can hope for.",
    {},
  ],

  // Quotes
  ["mei-q", "mei", 110, "This, but for design systems: people read the gaps between components more than the components.", { quoteOf: "ada-2" }],
  ["robin-q", "robin", 160, "The menu checklist everyone should tape to their monitor.", { quoteOf: "priya-1" }],
  [
    "juan-q",
    "juan",
    120,
    "Bus stop moving 50 m and the cycle contraflow stays open. This is what a good road works notice looks like.",
    { quoteOf: "harbourton-1" },
  ],

  // Older posts, for profiles
  [
    "ada-old-1",
    "ada",
    6_500,
    "The new trains have a button that opens the door only when you press it. The old ones opened every door at every stop. In winter, this is the single biggest improvement of the decade.",
    {},
  ],
  ["priya-old-1", "priya", 7_200, "Hot take: the best accessibility feature is a visible focus outline. Second best is not removing it.", {}],
  ["grace-old-1", "grace", 8_000, "The light from that star left before there were any people. And here it is, landing on my telescope, on a Tuesday.", {}],
  ["hannah-old-1", "hannah", 7_000, "Lamination is just folding with patience.", {}],
  ["kwame-old-1", "kwame", 7_500, "Developed 12 rolls this weekend. The bathroom smells like fixer and I regret nothing.", {}],
  ["felix-old-1", "felix", 8_200, "Gamedev diary: spent all day on how the lamp flickers. It flickers beautifully. Nothing else works.", {}],
  ["zoe-old-1", "zoe", 6_800, "Parents' evening tip: the child who says nothing in class has usually noticed everything.", {}],
  [
    "elif-old-1",
    "elif",
    7_700,
    "New chart in today's paper: rent as a share of income, by city, 2016–2026. The y-axis starts at zero. You're welcome.",
    { image: { seed: "rent-chart", alt: "A line chart with ten coloured lines rising gently, the highest ending near 48 percent", ratio: 16 / 9 } },
  ],
  ["juan-old-1", "juan", 8_400, "Bogotá added 22 km of protected lanes this year. Next year's target is 40. I will be counting.", {}],
  ["robin-old-1", "robin", 8_600, "Rewrote a date picker as a native <input type=date> plus a calendar for the rest. Deleted 1,900 lines.", {}],
];

/** Approximate counts for a post, scaled by the author's audience, unless the source gave them */
function counts(id: string, author: User, extra: PostSrc[4] = {}): Pick<Post, "replies" | "reposts" | "likes" | "views"> {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const r = (h % 1000) / 1000;
  const reach = author.followers * (extra.replyTo ? 0.002 : 0.02);
  const likes = Math.round(reach * (0.4 + r * 1.6)) + 1;
  return {
    replies: Math.round(likes * (0.04 + r * 0.06)),
    reposts: Math.round(likes * (0.08 + r * 0.2)),
    likes,
    views: Math.round(likes * (28 + r * 40)),
  };
}

export const POSTS: Post[] = SRC.map(([id, handle, minutes, text, extra = {}]) => {
  const author = USERS.find((u) => u.handle === handle)!;
  return { id, author: handle, at: new Date(NOW_MS - minutes * 60_000).toISOString(), text, ...counts(id, author, extra), ...extra };
}).sort((a, b) => b.at.localeCompare(a.at));

// Replies on a post are at least the ones written here
for (const p of POSTS) {
  const n = POSTS.filter((x) => x.replyTo === p.id).length;
  if (p.replies < n) p.replies = n;
}

export interface Trend {
  /** "Trending in Design", "Sports · Trending" */
  context: string;
  topic: string;
  posts: number;
}

export const TRENDS: Trend[] = [
  { context: "Science · Trending", topic: "#Comet", posts: 48_210 },
  { context: "Trending in Harbourton", topic: "Quay Street", posts: 3_204 },
  { context: "Technology · Trending", topic: "#a11y", posts: 12_870 },
  { context: "Food · Trending", topic: "Cardamom buns", posts: 6_430 },
  { context: "Trending in Design", topic: "#typography", posts: 9_115 },
  { context: "Sports · Trending", topic: "Harbourton Rovers", posts: 21_090 },
  { context: "Books · Trending", topic: "Sobremesa", posts: 2_870 },
  { context: "Trending", topic: "#HarbourtonHeron", posts: 15_402 },
  { context: "Gaming · Trending", topic: "#gamedev", posts: 33_640 },
  { context: "Trending in Cycling", topic: "Ciclovía", posts: 7_725 },
];

export type NotificationKind = "like" | "repost" | "follow" | "mention" | "reply";

export interface Notification {
  id: string;
  kind: NotificationKind;
  /** Who did it, most recent first */
  who: string[];
  /** And this many more */
  others?: number;
  /** The post it is about (yours for likes and reposts; theirs for mentions and replies) */
  postId?: string;
  minutesAgo: number;
}

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", kind: "reply", who: ["ben"], postId: "r-robin-3", minutesAgo: 18 },
  { id: "n2", kind: "like", who: ["priya", "mei", "samir"], others: 41, postId: "robin-1", minutesAgo: 20 },
  { id: "n3", kind: "reply", who: ["priya"], postId: "r-robin-1", minutesAgo: 25 },
  { id: "n4", kind: "repost", who: ["ada", "juan"], others: 6, postId: "robin-1", minutesAgo: 28 },
  { id: "n5", kind: "follow", who: ["felix", "linnea", "ben"], minutesAgo: 50 },
  { id: "n6", kind: "mention", who: ["ada"], postId: "r-ada-3", minutesAgo: 66 },
  { id: "n7", kind: "like", who: ["kwame"], postId: "r-ada-2", minutesAgo: 68 },
  { id: "n8", kind: "like", who: ["priya", "lbrandt"], others: 12, postId: "robin-q", minutesAgo: 150 },
  { id: "n9", kind: "mention", who: ["priya"], postId: "r-priya-3", minutesAgo: 220 },
  { id: "n10", kind: "follow", who: ["northlight"], minutesAgo: 900 },
  { id: "n11", kind: "like", who: ["zoe", "devika", "tom"], others: 236, postId: "robin-2", minutesAgo: 1_480 },
  { id: "n12", kind: "repost", who: ["hannah"], postId: "robin-3", minutesAgo: 4_300 },
  { id: "n13", kind: "follow", who: ["sofia", "jules"], minutesAgo: 4_500 },
];

// -------------------------------------------------------------------------------------------------
// Lookups

const userMap = new Map(USERS.map((u) => [u.handle, u]));
const postMap = new Map(POSTS.map((p) => [p.id, p]));

export function userBy(handle: string): User {
  const u = userMap.get(handle);
  if (!u) throw new Error(`No user @${handle}`);
  return u;
}
export const findUser = (handle: string): User | undefined => userMap.get(handle);
export const postById = (id: string): Post | undefined => postMap.get(id);

/** Posts that start a conversation or quote one: what timelines show */
export const topLevel = (p: Post) => !p.replyTo;

/** The posts above a reply, oldest first */
export function ancestors(post: Post): Post[] {
  const chain: Post[] = [];
  let p = post.replyTo ? postMap.get(post.replyTo) : undefined;
  while (p) {
    chain.unshift(p);
    p = p.replyTo ? postMap.get(p.replyTo) : undefined;
  }
  return chain;
}

/** Direct replies, oldest first */
export const repliesTo = (id: string): Post[] => POSTS.filter((p) => p.replyTo === id).sort((a, b) => a.at.localeCompare(b.at));

export const postsBy = (handle: string): Post[] => POSTS.filter((p) => p.author === handle);

/** The For you timeline: every post that isn't a reply, newest first */
export const forYou = (): Post[] => POSTS.filter(topLevel);
/** The Following timeline: posts by accounts you follow, and your own */
export const followingTimeline = (): Post[] => POSTS.filter((p) => topLevel(p) && (FOLLOWING.includes(p.author) || p.author === ME));

/** People to suggest: not you, not already followed, most followed first */
export const suggestions = (count = 3, skip: string[] = []): User[] =>
  USERS.filter((u) => u.handle !== ME && !FOLLOWING.includes(u.handle) && !skip.includes(u.handle))
    .sort((a, b) => b.followers - a.followers)
    .slice(0, count);

// -------------------------------------------------------------------------------------------------
// Formatting, the same on the server and in every browser

/** 1234 → "1,234"; 12_500 → "12.5K"; 1_200_000 → "1.2M" */
export function compact(n: number): string {
  if (n < 10_000) return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (n < 1_000_000) return `${(Math.round(n / 100) / 10).toString()}K`;
  return `${(Math.round(n / 100_000) / 10).toString()}M`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** A post's time in a timeline: "now", "12m", "3h", then "Oct 21", and "Oct 21, 2025" in another year */
export function shortTime(iso: string): string {
  const mins = Math.floor((NOW_MS - Date.parse(iso)) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h`;
  const d = new Date(iso);
  const nowYear = new Date(NOW_MS).getUTCFullYear();
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}${d.getUTCFullYear() === nowYear ? "" : `, ${d.getUTCFullYear()}`}`;
}

/** A post's full time, on its own page: "4:30 PM · Oct 24, 2026" (UTC) */
export function fullTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours();
  return `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"} · ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** "2019-04" → "April 2019" */
export function joinedDate(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

/** When a notification happened: "18m", "3h", "Oct 21" */
export const agoMinutes = (minutes: number) => shortTime(new Date(NOW_MS - minutes * 60_000).toISOString());
