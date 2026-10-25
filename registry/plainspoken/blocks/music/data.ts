// The catalogue behind the Music demo: twelve invented artists, their albums, EPs and singles,
// about two hundred tracks and a dozen playlists. Everything is fixed or generated from a seed,
// so the server and the browser always agree. "Now" is a fixed moment (NOW), never the clock.

/** The demo's "now": greetings, "added 3 days ago" and recent plays are measured from here */
export const NOW = "2026-10-24T19:30:00Z";
const NOW_MS = Date.parse(NOW);
const DAY = 86_400_000;

/** The app's name, shown as the owner of the playlists it makes for you */
export const APP_NAME = "Turntable";

/** The listener using the app */
export const YOU = { id: "robin", name: "Robin Achterberg" };

export interface Artist {
  id: string;
  name: string;
  /** Genre ids, first is the main one (see GENRES) */
  genres: string[];
  city: string;
  bio: string;
  monthlyListeners: number;
  verified: boolean;
  /** Artists their listeners also play */
  related: string[];
}

export type AlbumKind = "Album" | "EP" | "Single";

export interface Album {
  id: string;
  title: string;
  artistId: string;
  kind: AlbumKind;
  /** ISO date */
  released: string;
  label: string;
  trackIds: string[];
}

export interface Track {
  id: string;
  title: string;
  albumId: string;
  /** Main artist first, then featured artists */
  artistIds: string[];
  /** Seconds */
  duration: number;
  plays: number;
  explicit: boolean;
}

export interface PlaylistEntry {
  trackId: string;
  /** ISO date it was added */
  added: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  /** Who made it: YOU.name, APP_NAME, or another listener */
  owner: string;
  /** Genre or mood ids, for browsing */
  tags: string[];
  followers: number;
  entries: PlaylistEntry[];
}

export interface Genre {
  id: string;
  name: string;
  /** Artwork seed for its tile */
  seed: string;
}

export const GENRES: Genre[] = [
  { id: "pop", name: "Pop", seed: "genre-pop" },
  { id: "indie", name: "Indie", seed: "genre-indie" },
  { id: "electronic", name: "Electronic", seed: "genre-electronic" },
  { id: "beats", name: "Hip hop & beats", seed: "genre-beats" },
  { id: "soul", name: "Soul & R&B", seed: "genre-soul" },
  { id: "jazz", name: "Jazz", seed: "genre-jazz" },
  { id: "folk", name: "Folk & acoustic", seed: "genre-folk" },
  { id: "rock", name: "Rock", seed: "genre-rock" },
  { id: "latin", name: "Latin", seed: "genre-latin" },
  { id: "ambient", name: "Ambient & classical", seed: "genre-ambient" },
  { id: "focus", name: "Focus", seed: "mood-focus" },
  { id: "chill", name: "Chill", seed: "mood-chill" },
  { id: "workout", name: "Workout", seed: "mood-workout" },
  { id: "dinner", name: "Dinner", seed: "mood-dinner" },
  { id: "sleep", name: "Sleep", seed: "mood-sleep" },
  { id: "party", name: "Party", seed: "mood-party" },
  { id: "rainy", name: "Rainy day", seed: "mood-rainy" },
  { id: "drive", name: "Road trip", seed: "mood-drive" },
];

export const ARTISTS: Artist[] = [
  {
    id: "marigold-static",
    name: "Marigold Static",
    genres: ["indie", "pop", "rainy"],
    city: "Leeds, UK",
    bio: "Four friends from Leeds who met queueing for the same sold-out gig and decided to make the noise themselves. Reverb-soaked guitars, drum machines borrowed from a youth club, and songs about the bits of city nobody photographs.",
    monthlyListeners: 2_481_903,
    verified: true,
    related: ["juniper-vale", "the-lantern-hours", "the-grey-herons"],
  },
  {
    id: "oskar-venn",
    name: "Oskar Venn",
    genres: ["electronic", "drive", "focus"],
    city: "Copenhagen, Denmark",
    bio: "Oskar Venn writes his tracks on the night bus, on a laptop with a cracked screen, between the last shift and the first train. Warm, rolling electronic music for people who are still awake.",
    monthlyListeners: 1_204_377,
    verified: true,
    related: ["low-orbit", "juniper-vale", "halvard"],
  },
  {
    id: "the-lantern-hours",
    name: "The Lantern Hours",
    genres: ["folk", "indie", "chill"],
    city: "Burlington, Vermont",
    bio: "A five-piece that records in a converted dairy barn, the woodstove going. Banjo, pedal steel and three-part harmonies about weather, family and the roads in between.",
    monthlyListeners: 893_120,
    verified: true,
    related: ["kestrel-and-finch", "marigold-static", "halvard"],
  },
  {
    id: "nadia-okafor",
    name: "Nadia Okafor",
    genres: ["soul", "dinner", "chill"],
    city: "London, UK",
    bio: "Born in Lagos, raised in Peckham. Nadia sang in her aunt's church choir before swapping hymns for a Rhodes piano and a band that plays every song a little slower than you expect.",
    monthlyListeners: 3_310_554,
    verified: true,
    related: ["ines-quarteto", "low-orbit", "sol-ramirez"],
  },
  {
    id: "kestrel-and-finch",
    name: "Kestrel & Finch",
    genres: ["folk", "chill", "sleep"],
    city: "Norfolk, UK",
    bio: "Siblings Ellie and Tom Finch: one guitar, one fiddle, and an old field recorder they take on every walk. Their songs come with the birdsong still in them.",
    monthlyListeners: 412_008,
    verified: false,
    related: ["the-lantern-hours", "halvard"],
  },
  {
    id: "paper-tigers-club",
    name: "Paper Tigers Club",
    genres: ["rock", "workout", "party"],
    city: "Melbourne, Australia",
    bio: "Three chords, two amps, one van that mostly starts. Paper Tigers Club play fast, short and loud, and finish every show with the drummer standing on the kick drum.",
    monthlyListeners: 655_431,
    verified: true,
    related: ["marigold-static", "the-grey-herons"],
  },
  {
    id: "ines-quarteto",
    name: "Ines Quarteto",
    genres: ["jazz", "dinner", "chill"],
    city: "Lisbon, Portugal",
    bio: "Pianist Inês Carvalho's quartet mixes hard bop with the melodies of the fado houses she grew up above. Upright bass, brushed drums, and a flugelhorn that sounds like the river at night.",
    monthlyListeners: 287_965,
    verified: true,
    related: ["nadia-okafor", "halvard", "sol-ramirez"],
  },
  {
    id: "halvard",
    name: "Halvard",
    genres: ["ambient", "sleep", "focus"],
    city: "Tromsø, Norway",
    bio: "Solo piano recorded with the felt down and the microphones close, in a wooden house north of the Arctic Circle. You can hear the pedals, the chair, and sometimes the snow.",
    monthlyListeners: 1_877_002,
    verified: true,
    related: ["kestrel-and-finch", "oskar-venn", "the-grey-herons"],
  },
  {
    id: "juniper-vale",
    name: "Juniper Vale",
    genres: ["pop", "electronic", "party"],
    city: "Toronto, Canada",
    bio: "Juniper Vale makes glittering synth-pop out of heartbreak and drum machines, and plays every show in the same silver jacket. Her second album went from bedroom demo to arena encore in a year.",
    monthlyListeners: 5_902_118,
    verified: true,
    related: ["marigold-static", "oskar-venn", "sol-ramirez"],
  },
  {
    id: "low-orbit",
    name: "Low Orbit",
    genres: ["beats", "focus", "chill"],
    city: "Osaka, Japan",
    bio: "Dusty drums, tape hiss and jazz chords chopped from records bought by the kilo. Low Orbit makes music for studying, for trains, and for the hour after midnight when the city goes quiet.",
    monthlyListeners: 2_046_759,
    verified: true,
    related: ["oskar-venn", "nadia-okafor", "halvard"],
  },
  {
    id: "sol-ramirez",
    name: "Sol Ramírez",
    genres: ["latin", "electronic", "party"],
    city: "Barranquilla, Colombia",
    bio: "Sol Ramírez plays her grandfather's accordion through a rack of synthesizers. Cumbia from the coast, rebuilt for the dance floor, and sung in the voice of someone who has heard it all at the market.",
    monthlyListeners: 1_590_884,
    verified: true,
    related: ["juniper-vale", "nadia-okafor", "ines-quarteto"],
  },
  {
    id: "the-grey-herons",
    name: "The Grey Herons",
    genres: ["rock", "ambient", "rainy"],
    city: "Glasgow, UK",
    bio: "Instrumental post-rock that builds for six minutes and then lets go. The Grey Herons record live in one room, and name their songs after the weather on the day.",
    monthlyListeners: 534_276,
    verified: false,
    related: ["marigold-static", "halvard", "paper-tigers-club"],
  },
];

type TrackSrc = string | [title: string, featuring: string[]];
type AlbumSrc = [id: string, title: string, artistId: string, kind: AlbumKind, released: string, label: string, tracks: TrackSrc[]];

const ALBUM_SRC: AlbumSrc[] = [
  [
    "glasshouse-summer",
    "Glasshouse Summer",
    "marigold-static",
    "Album",
    "2025-06-13",
    "Northern Wire Records",
    [
      "Glasshouse",
      "Slow Tide",
      "Polaroid Weather",
      "Ferris Wheel at Dusk",
      "Halogen",
      "Nobody Calls It Love",
      "Swimming in Static",
      "Pale Blue Fridge Light",
      "Hourglass",
      "Overpass Hymn",
      "Goodnight, Kingsway",
    ],
  ],
  [
    "lanterns-on-the-canal",
    "Lanterns on the Canal",
    "marigold-static",
    "EP",
    "2023-03-03",
    "Northern Wire Records",
    ["Canal Street Lights", "Bicycle Bell", "Weir", "Low Bridge", "Lanterns"],
  ],
  ["kingsway-nights", "Kingsway Nights", "marigold-static", "Single", "2026-10-09", "Northern Wire Records", ["Kingsway Nights", "Kingsway Nights (Demo)"]],
  [
    "night-bus-atlas",
    "Night Bus Atlas",
    "oskar-venn",
    "Album",
    "2026-02-20",
    "Kastrup Tapes",
    [
      "N12 to Nørrebro",
      "Sodium",
      "Late Shift",
      "Harbour Cranes",
      "Interlude (Rain on Glass)",
      "Ticket Machine",
      "Metro Mind",
      "Last Stop",
      ["Afterglow District", ["juniper-vale"]],
      "Dawn Depot",
    ],
  ],
  ["cold-open", "Cold Open", "oskar-venn", "Single", "2026-09-18", "Kastrup Tapes", ["Cold Open", "Cold Open (Dub)"]],
  [
    "woodsmoke-and-wire",
    "Woodsmoke & Wire",
    "the-lantern-hours",
    "Album",
    "2024-10-04",
    "Hollow Pine Music",
    [
      "Woodsmoke",
      "The Long Field",
      "Barn Owl",
      "Kerosene",
      "Wire Fences",
      "Old Route 9",
      ["Winter Wheat", ["kestrel-and-finch"]],
      "Porch Light Waltz",
      "Snowmelt",
      "Hollow Pines",
      "Your Father's Coat",
      "Home by Lamplight",
    ],
  ],
  [
    "small-hours",
    "Small Hours",
    "the-lantern-hours",
    "Album",
    "2021-05-21",
    "Hollow Pine Music",
    [
      "Small Hours",
      "Kettle Song",
      "Mapmaker",
      "Cedar",
      "The River Doesn't Mind",
      "Weathervane",
      "Paper Boats",
      "Nine Miles",
      "Ember",
      "Lullaby for the Lights",
    ],
  ],
  [
    "velvet-hours",
    "Velvet Hours",
    "nadia-okafor",
    "Album",
    "2025-09-26",
    "Peckham Soul Co.",
    [
      "Velvet",
      "Honey in the Bottle",
      "Call Me Back",
      "Slow Motion Sunday",
      "Indigo",
      "Gold Teeth",
      "Mama's Kitchen",
      ["Lagos to London", ["low-orbit"]],
      "Still Water",
      "The Way You Say It",
      "Velvet (Reprise)",
    ],
  ],
  [
    "kitchen-radio",
    "Kitchen Radio",
    "nadia-okafor",
    "Album",
    "2022-04-08",
    "Peckham Soul Co.",
    [
      "Kitchen Radio",
      "Sunday Best",
      "Hold the Door",
      "Pepper Soup",
      "Your Voice on the Line",
      "Rain Dance",
      "Mirror Talk",
      "Stay a While",
      "Tuesday Blues",
      "Kitchen Radio (Outro)",
    ],
  ],
  ["brighter", "Brighter", "nadia-okafor", "Single", "2026-10-16", "Peckham Soul Co.", ["Brighter"]],
  [
    "hedgerow",
    "Hedgerow",
    "kestrel-and-finch",
    "Album",
    "2022-08-19",
    "Saltings Records",
    [
      "Hedgerow",
      "Blackbird at the Window",
      "Two Coats of Paint",
      "Market Day",
      "Salt Marsh",
      "The Lark Again",
      "Allotment",
      "Wren",
      "Bramble",
      "Field Recording No. 3",
    ],
  ],
  [
    "loud-enough-to-matter",
    "Loud Enough to Matter",
    "paper-tigers-club",
    "Album",
    "2024-03-15",
    "Fitzroy Fuzz",
    [
      "Loud Enough",
      "Basement Show",
      "Broken Amp Blues",
      "Teenage Static",
      "Parking Lot Prophet",
      "Chewing Gum Heart",
      "Fuzz Pedal Romance",
      "Sunburn",
      "Detention",
      "Last Tram Home",
      "Feedback Loop",
    ],
  ],
  [
    "garage-tapes-vol-1",
    "Garage Tapes Vol. 1",
    "paper-tigers-club",
    "EP",
    "2022-11-11",
    "Fitzroy Fuzz",
    ["Garage Tapes", "Skateboard", "Cheap Sunglasses", "Fire Escape", "Encore"],
  ],
  [
    "alfama-blue",
    "Alfama Blue",
    "ines-quarteto",
    "Album",
    "2023-01-27",
    "Sete Colinas Jazz",
    ["Alfama Blue", "Tram 28", "Saudade in B♭", "Miradouro", "Late Night at the Tasca", "Azulejo", "Rua das Flores", "Tejo at Dawn"],
  ],
  [
    "live-at-casa-cerca",
    "Live at Casa Cerca",
    "ines-quarteto",
    "Album",
    "2025-11-14",
    "Sete Colinas Jazz",
    ["Count In", "Tram 28 (Live)", "Fado for Piano", "Bica", ["Sete Colinas", ["nadia-okafor"]], "Azulejo (Live)", "Goodnight, Lisboa"],
  ],
  [
    "northern-rooms",
    "Northern Rooms",
    "halvard",
    "Album",
    "2024-01-12",
    "Fjellstue",
    [
      "Room I: Morning",
      "Room II: Frost on the Window",
      "Room III: Kettle",
      "Room IV: Letters",
      "Room V: The Long Corridor",
      "Room VI: Snowfall",
      "Room VII: Lamps",
      "Room VIII: Sleeping House",
      "Room IX: Thaw",
      "Room X: Doorway",
    ],
  ],
  [
    "tidewater",
    "Tidewater",
    "halvard",
    "Album",
    "2026-08-28",
    "Fjellstue",
    ["Tidewater", "Slack Water", "Kelp", "Lighthouse Keeper", "Fog Bell", "Shingle", "Neap", "Spring Tide"],
  ],
  [
    "neon-orchard",
    "Neon Orchard",
    "juniper-vale",
    "Album",
    "2025-04-25",
    "Glasshouse Pop",
    [
      "Neon Orchard",
      "Heartbeat Arcade",
      "Cherry Soda Skyline",
      "Disco Ball Confessions",
      "Running Lights",
      "Tell Me Twice",
      "Electric Blue",
      "Mirrorball",
      ["Satellite Hearts", ["sol-ramirez"]],
      "Midnight Lemonade",
      "Orchard Reprise",
    ],
  ],
  [
    "tell-me-twice-remixes",
    "Tell Me Twice (Remixes)",
    "juniper-vale",
    "EP",
    "2026-07-10",
    "Glasshouse Pop",
    [["Tell Me Twice (Oskar Venn Remix)", ["oskar-venn"]], "Tell Me Twice (Club Edit)", "Tell Me Twice (Acoustic)"],
  ],
  [
    "postcards-from-the-future",
    "Postcards from the Future",
    "juniper-vale",
    "Album",
    "2022-09-02",
    "Glasshouse Pop",
    [
      "Postcards",
      "Holograms",
      "Slow Dance in Zero G",
      "Static Kiss",
      "Tomorrow Again",
      "Laser Pointer",
      "Rollerdisco",
      "Nightbloom",
      "Better in Pixels",
      "Return to Sender",
    ],
  ],
  [
    "lo-fi-satellites",
    "Lo-Fi Satellites",
    "low-orbit",
    "Album",
    "2023-06-30",
    "Dotonbori Beats",
    [
      "Liftoff",
      "Coffee Rings",
      "Dusty Keys",
      "Window Seat",
      "Rain Check",
      "Study Hall",
      "Tape Hiss",
      "Orbit",
      "Moonbase Laundromat",
      "Vinyl Crackle",
      "Late Library",
      "Reentry",
    ],
  ],
  ["weekday-mornings", "Weekday Mornings", "low-orbit", "EP", "2026-05-15", "Dotonbori Beats", ["Snooze", "Toast", "Commute", "Inbox Zero", "Lunch Break"]],
  [
    "cumbia-del-satelite",
    "Cumbia del Satélite",
    "sol-ramirez",
    "Album",
    "2025-07-18",
    "Costa Verde Discos",
    [
      "Cumbia del Satélite",
      "Mercado",
      "Calor",
      "Bajo la Luna",
      "Guacharaca Digital",
      "Río Magdalena",
      "Baila Conmigo",
      "Tierra Caliente",
      "Acordeón de Neón",
      "Despedida",
    ],
  ],
  [
    "we-were-the-weather",
    "We Were the Weather",
    "the-grey-herons",
    "Album",
    "2024-11-08",
    "Clyde Sound",
    ["We Were the Weather", "Barometer", "Gale Warning", "Eye of the Storm", "After the Rain, the Rooks", "Pressure Front", "Clearing"],
  ],
  [
    "estuary",
    "Estuary",
    "the-grey-herons",
    "Album",
    "2020-02-14",
    "Clyde Sound",
    ["Estuary", "Mudflats", "Heron Standing Still", "Spring Tide Rising", "Saltings", "The Sea Takes Back"],
  ],
];

// -------------------------------------------------------------------------------------------------
// Seeded randomness, so durations, plays and playlists are "random" but the same everywhere

/** A 32-bit hash of a string (FNV-1a) */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A small seeded generator (mulberry32): the same seed gives the same numbers in [0, 1) */
export function seeded(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Typical track lengths per main genre, seconds */
const LENGTHS: Record<string, [number, number]> = {
  indie: [190, 290],
  electronic: [220, 380],
  folk: [170, 280],
  soul: [190, 300],
  rock: [130, 215],
  jazz: [270, 520],
  ambient: [150, 330],
  pop: [170, 240],
  beats: [110, 190],
  latin: [190, 290],
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const TRACKS: Track[] = [];
export const ALBUMS: Album[] = ALBUM_SRC.map(([id, title, artistId, kind, released, label, tracks]) => {
  const artist = ARTISTS.find((a) => a.id === artistId)!;
  const [lo, hi] = LENGTHS[artist.genres[0]] ?? [180, 280];
  // Popularity: newer and singles do better; within an album, the first few and one "hit" lead
  const fame = artist.monthlyListeners / 1_000_000;
  const rand = seeded(id);
  const hit = Math.floor(rand() * Math.min(tracks.length, 5));
  const trackIds = tracks.map((src, i) => {
    const [t, feat] = typeof src === "string" ? [src, []] : src;
    const tid = `${id}--${slug(t)}`;
    const r = rand();
    const weight = (i === hit ? 3.2 : 1) * (1 / (1 + i * 0.18)) * (kind === "Single" ? 1.6 : 1);
    TRACKS.push({
      id: tid,
      title: t,
      albumId: id,
      artistIds: [artistId, ...feat],
      duration: Math.round(lo + r * (hi - lo)),
      plays: Math.round(fame * weight * (4_000_000 + rand() * 9_000_000)),
      explicit: artist.genres[0] === "rock" && rand() < 0.3,
    });
    return tid;
  });
  return { id, title, artistId, kind, released, label, trackIds };
});

// -------------------------------------------------------------------------------------------------
// Playlists: picked from the catalogue by genre, with dates added spread over the past months

const daysAgo = (d: number) => new Date(NOW_MS - Math.round(d) * DAY).toISOString().slice(0, 10);

function pickTracks(seed: string, count: number, genres: string[], spanDays: number): PlaylistEntry[] {
  const rand = seeded(seed);
  const pool = TRACKS.filter((t) => {
    // A find, not artistById: this runs while the module loads, before the lookup maps exist
    const a = ARTISTS.find((x) => x.id === t.artistIds[0])!;
    return a.genres.some((g) => genres.includes(g));
  });
  // Fisher–Yates on a copy, then take the first `count`
  const order = [...pool];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const chosen = order.slice(0, count);
  // Added oldest first, the order a playlist grows in
  const ages = chosen.map(() => rand() * spanDays).sort((a, b) => b - a);
  return chosen.map((t, i) => ({ trackId: t.id, added: daysAgo(ages[i]) }));
}

export const PLAYLISTS: Playlist[] = [
  {
    id: "sunday-morning-coffee",
    title: "Sunday Morning Coffee",
    description: "Slow songs for the first cup, the crossword and the radiator ticking.",
    owner: YOU.name,
    tags: ["chill", "folk", "jazz"],
    followers: 12,
    entries: pickTracks("sunday", 24, ["folk", "jazz", "soul", "sleep"], 420),
  },
  {
    id: "night-drive",
    title: "Night Drive",
    description: "Motorway lights, empty petrol stations, the long way home.",
    owner: YOU.name,
    tags: ["drive", "electronic"],
    followers: 31,
    entries: pickTracks("night-drive", 30, ["electronic", "drive", "pop", "beats"], 300),
  },
  {
    id: "run-club-170",
    title: "Run Club 170",
    description: "Fast, loud and in time with your feet. Tuesday and Thursday, 6:30 at the park gates.",
    owner: YOU.name,
    tags: ["workout", "rock"],
    followers: 8,
    entries: pickTracks("run-club", 22, ["rock", "workout", "party", "latin"], 200),
  },
  {
    id: "deep-focus",
    title: "Deep Focus",
    description: "Keep calm and concentrate: ambient piano and quiet beats, no words to get in the way.",
    owner: APP_NAME,
    tags: ["focus", "ambient", "beats"],
    followers: 4_812_330,
    entries: pickTracks("deep-focus", 28, ["focus", "ambient", "sleep"], 90),
  },
  {
    id: "daily-mix-1",
    title: "Daily Mix 1",
    description: "Marigold Static, Juniper Vale, The Grey Herons and more.",
    owner: APP_NAME,
    tags: ["indie", "pop"],
    followers: 0,
    entries: pickTracks("mix-1", 26, ["indie", "pop", "rainy"], 1),
  },
  {
    id: "daily-mix-2",
    title: "Daily Mix 2",
    description: "The Lantern Hours, Kestrel & Finch, Halvard and more.",
    owner: APP_NAME,
    tags: ["folk", "ambient"],
    followers: 0,
    entries: pickTracks("mix-2", 26, ["folk", "sleep", "ambient"], 1),
  },
  {
    id: "weekly-finds",
    title: "Weekly Finds",
    description: "Thirty songs you haven't heard yet, picked for you every Monday.",
    owner: APP_NAME,
    tags: ["indie", "electronic", "soul"],
    followers: 0,
    entries: pickTracks("weekly", 30, ["soul", "latin", "jazz", "electronic", "rock"], 5),
  },
  {
    id: "on-repeat",
    title: "On Repeat",
    description: "The songs you can't stop playing this month.",
    owner: APP_NAME,
    tags: ["pop", "indie"],
    followers: 0,
    entries: pickTracks("on-repeat", 20, ["pop", "indie", "soul", "electronic"], 30),
  },
  {
    id: "rainy-day-indie",
    title: "Rainy Day Indie",
    description: "Grey skies, wet pavements, headphones on.",
    owner: APP_NAME,
    tags: ["rainy", "indie"],
    followers: 1_203_557,
    entries: pickTracks("rainy", 25, ["rainy", "indie", "folk"], 120),
  },
  {
    id: "dinner-party",
    title: "Dinner Party",
    description: "Low lights, second helpings, nobody checking their phone.",
    owner: "Mara Lindqvist",
    tags: ["dinner", "jazz", "soul"],
    followers: 214,
    entries: pickTracks("dinner", 27, ["dinner", "jazz", "soul", "latin"], 500),
  },
  {
    id: "kitchen-disco",
    title: "Kitchen Disco",
    description: "Wooden spoon microphones mandatory.",
    owner: "Theo Marchetti",
    tags: ["party", "pop"],
    followers: 96,
    entries: pickTracks("disco", 24, ["party", "pop", "latin"], 260),
  },
];

/** The listener's own songs, most recent first in the list below; the like state starts from here */
export const LIKED_SONGS: PlaylistEntry[] = pickTracks("liked", 44, ["indie", "pop", "soul", "folk", "electronic", "jazz", "beats", "latin"], 700);

/** What's in the library to start with */
export const INITIAL_LIBRARY = {
  albums: ["glasshouse-summer", "night-bus-atlas", "woodsmoke-and-wire", "velvet-hours", "alfama-blue", "northern-rooms", "neon-orchard", "lo-fi-satellites"],
  artists: ["marigold-static", "nadia-okafor", "halvard", "juniper-vale", "low-orbit", "the-lantern-hours", "ines-quarteto"],
  playlists: ["sunday-morning-coffee", "night-drive", "run-club-170", "deep-focus", "rainy-day-indie", "dinner-party", "kitchen-disco", "on-repeat"],
};

/** When each library item was added and last played (ISO), for the library's sort orders */
export const LIBRARY_DATES: Record<string, { added: string; played: string }> = Object.fromEntries(
  [...INITIAL_LIBRARY.albums, ...INITIAL_LIBRARY.artists, ...INITIAL_LIBRARY.playlists, "liked"].map((id) => {
    const r = seeded(`lib-${id}`);
    const added = 30 + r() * 600;
    return [id, { added: daysAgo(added), played: daysAgo(Math.min(added, r() * 40)) }];
  }),
);

/** The home page's "jump back in": what was played most recently, as [kind, id] */
export const RECENTLY_PLAYED: [kind: "album" | "playlist" | "artist", id: string][] = [
  ["playlist", "night-drive"],
  ["album", "tidewater"],
  ["playlist", "deep-focus"],
  ["album", "velvet-hours"],
  ["playlist", "sunday-morning-coffee"],
  ["album", "neon-orchard"],
  ["playlist", "on-repeat"],
  ["album", "lo-fi-satellites"],
];

// -------------------------------------------------------------------------------------------------
// Lookups

const artistMap = new Map(ARTISTS.map((a) => [a.id, a]));
const albumMap = new Map(ALBUMS.map((a) => [a.id, a]));
const trackMap = new Map(TRACKS.map((t) => [t.id, t]));
const playlistMap = new Map(PLAYLISTS.map((p) => [p.id, p]));

export function artistById(id: string): Artist {
  const a = artistMap.get(id);
  if (!a) throw new Error(`No artist ${id}`);
  return a;
}
export const albumById = (id: string): Album | undefined => albumMap.get(id);
export const trackById = (id: string): Track | undefined => trackMap.get(id);
export const playlistById = (id: string): Playlist | undefined => playlistMap.get(id);

/** The tracks of an album, in order */
export const albumTracks = (album: Album): Track[] => album.trackIds.map((id) => trackMap.get(id)!);

/** An artist's releases, newest first */
export const releasesBy = (artistId: string): Album[] => ALBUMS.filter((a) => a.artistId === artistId).sort((a, b) => b.released.localeCompare(a.released));

/** An artist's most played tracks, including ones they are featured on */
export const popularTracks = (artistId: string, count = 10): Track[] =>
  TRACKS.filter((t) => t.artistIds.includes(artistId))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, count);

/** The artists of a track, by name, joined: "Juniper Vale, Sol Ramírez" */
export const artistNames = (t: Track): string => t.artistIds.map((id) => artistById(id).name).join(", ");

/** Letters for a picture: "Marigold Static" → "MS", "Halvard" → "HA" (small words like "the" skipped) */
export function initialsOf(text: string): string {
  const words = text
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((w) => w && !/^(the|of|a|to|in|del|la)$/i.test(w));
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

/** Year of release */
export const year = (a: Album): string => a.released.slice(0, 4);

// -------------------------------------------------------------------------------------------------
// Formatting, the same on the server and in every browser (no locale-dependent output)

/** 222 → "3:42"; 3725 → "1:02:05" */
export function clock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** 222 → "3 minutes 42 seconds", for screen readers */
export function spokenTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const parts = [m ? `${m} minute${m === 1 ? "" : "s"}` : "", `${s % 60} second${s % 60 === 1 ? "" : "s"}`];
  return parts.filter(Boolean).join(" ");
}

/** A collection's length: "48 min 12 sec", or "about 2 hr 5 min" past an hour */
export function totalLength(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} min ${Math.floor(sec % 60)} sec`;
  return `about ${Math.floor(m / 60)} hr ${m % 60} min`;
}

/** 4812330 → "4,812,330" */
export const formatCount = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** "4,812,330 monthly listeners" */
export const monthlyListeners = (n: number): string => `${formatCount(n)} monthly listeners`;

/** "1 song", "24 songs" */
export const plural = (n: number, one: string, many = `${one}s`): string => `${formatCount(n)} ${n === 1 ? one : many}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-10-12" → "Oct 12, 2026" */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "2026-10-12" → "October 12, 2026" */
export function longDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS_LONG[m - 1]} ${d}, ${y}`;
}

/** When something was added: "today", "3 days ago", "2 weeks ago", then the date */
export function addedAgo(iso: string): string {
  const days = Math.round((NOW_MS - Date.parse(`${iso.slice(0, 10)}T12:00:00Z`)) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 28) return `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`;
  return shortDate(iso);
}

/** The greeting at the top of home, from the fixed "now" */
export function greeting(): string {
  const h = new Date(NOW_MS).getUTCHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** Links inside the demo */
export const MUSIC_BASE = "/demos/music";
export const hrefFor = {
  album: (id: string) => `${MUSIC_BASE}/album/${id}`,
  artist: (id: string) => `${MUSIC_BASE}/artist/${id}`,
  playlist: (id: string) => `${MUSIC_BASE}/playlist/${id}`,
};

/**
 * A start for the player in stories, docs and the demo: a playlist loaded at one of its tracks,
 * paused part-way in unless `playing`. Pass it to MusicProvider's (or MusicApp's) `initial`.
 */
export function demoPlayback(playlistId = "night-drive", { track = 3, playing = false, position = 84, upNext = [] as string[] } = {}) {
  const p = playlistById(playlistId) ?? PLAYLISTS[0];
  const trackIds = p.entries.map((e) => e.trackId);
  return {
    context: { kind: "playlist" as const, id: p.id, title: p.title, href: hrefFor.playlist(p.id) },
    trackIds,
    start: trackIds[Math.min(track, trackIds.length - 1)],
    playing,
    position,
    upNext,
  };
}
