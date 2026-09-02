export const templates = [
  {
    id: 1,
    title: "The Little Explorer",
    category: "Adventure",
    age: "Ages 6–8",
    image:
      "https://res.cloudinary.com/djdct0pxu/image/upload/v1728978240/samples/ecommerce/analog-classic.jpg",
    description:
      "A curious little explorer finds a hidden path that leads to amazing discoveries.Step into a magical kingdom filled with wonderful creatures, castles, and unexpected adventures.",
  },
  {
    id: 2,
    title: "Magic Kingdom",
    category: "Fantasy",
    age: "Ages 5–8",
    image:
      "https://res.cloudinary.com/djdct0pxu/image/upload/v1728978242/samples/landscapes/architecture-signs.jpg",
    description:
      "Step into a magical kingdom filled with wonderful creatures, castles, and unexpected adventures.",
  },
  {
    id: 3,
    title: "Baby Dino's Friend",
    category: "Animals",
    age: "Ages 3–6",
    image:
      "https://images.unsplash.com/photo-1550853024-fae8cd4be47f?auto=format&fit=crop&w=700&q=90",
    description:
      "A little dinosaur discovers that friendship can be found in the most unexpected places.",
  },
  {
    id: 4,
    title: "Goodnight, Starry Sky",
    category: "Bedtime",
    age: "Ages 3–6",
    image:
      "https://res.cloudinary.com/djdct0pxu/image/upload/v1729075807/WonHubs/yj4nyyquzdkjoblyvwac.png",
    description:
      "A peaceful bedtime journey through a beautiful world beneath the stars.",
  },
  {
    id: 5,
    title: "The Brave Little Fox",
    category: "Adventure",
    age: "Ages 5–8",
    image:
      "https://res.cloudinary.com/djdct0pxu/image/upload/v1728978241/samples/animals/reindeer.jpg",
    description:
      "A brave little fox discovers that courage comes from believing in yourself.",
  },
  {
    id: 6,
    title: "Princess of the Clouds",
    category: "Fantasy",
    age: "Ages 6–9",
    image:
      "https://res.cloudinary.com/djdct0pxu/image/upload/v1729075583/WonHubs/hbzn3bq5urw58fs96j51.png",
    description:
      "High above the clouds, a young princess begins an unforgettable magical adventure.",
  },
  {
    id: 7,
    title: "My First Safari",
    category: "Animals",
    age: "Ages 3–6",
    image:
      "https://res.cloudinary.com/djdct0pxu/image/upload/v1729075151/WonHubs/hswzzfxmbxwb2wkfoizr.png",
    description:
      "Explore the wild and meet wonderful animals on a child's very first safari.",
  },
  {
    id: 8,
    title: "Dreamland Adventures",
    category: "Bedtime",
    age: "Ages 3–7",
    image:
      "https://res.cloudinary.com/djdct0pxu/image/upload/v1728978250/cld-sample-2.jpg",
    description:
      "Follow a magical dream through a world filled with stars, clouds, and imagination.",
  },
  {
    id: 8,
    type:'premium',
    title: "Dreamland Adventures",
    category: "Bedtime",
    age: "Ages 3–7",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=700&q=90",
    description:
      "Follow a magical dream through a world filled with stars, clouds, and imagination.",
  },
];

export const categories = ["All", "Adventure", "Fantasy", "Animals", "Bedtime"];

// Builds a simple page-turning "book" out of a template's cover image + description.
// Real per-page story art/text isn't part of the data, so this constructs a
// believable cover -> story -> end sequence from what each template already has.
export const buildPages = (template) => [
  {
    kind: "cover",
    image: template.image,
    heading: template.title,
    sub: `${template.category} · ${template.age}`,
  },
  {
    kind: "story",
    image: template.image,
    text: `Once upon a time, ${template.description.charAt(0).toLowerCase()}${template.description.slice(1)}`,
  },
  {
    kind: "story",
    image: template.image,
    text: "Every page turned brought a new surprise — a new friend, a new place, a new reason to keep going.",
  },
  {
    kind: "story",
    image: template.image,
    text: "By the end of the journey, one thing was certain: the biggest adventures start with a single brave step.",
  },
  {
    kind: "end",
    image: template.image,
    heading: "The End",
    sub: "Thanks for reading!",
  },
  {
    type:"premium",
    kind: "end",
    image: template.image,
    heading: "The End",
    sub: "Thanks for reading!",
  },
];

export const categoryThemes = {
  Adventure: {
    primary: "#E59A32",
    secondary: "#F7C66A",
    dark: "#A85D0A",
    gradient:
      "linear-gradient(180deg, rgba(229,154,50,0.08) 0%, rgba(20,16,22,0.88) 100%)",
  },

  Fantasy: {
    primary: "#7257B8",
    secondary: "#A994EA",
    dark: "#4B358A",
    gradient:
      "linear-gradient(180deg, rgba(114,87,184,0.06) 0%, rgba(20,16,30,0.9) 100%)",
  },

  Animals: {
    primary: "#3E9A77",
    secondary: "#73C8A5",
    dark: "#24664F",
    gradient:
      "linear-gradient(180deg, rgba(62,154,119,0.08) 0%, rgba(15,25,20,0.9) 100%)",
  },

  Bedtime: {
    primary: "#5368A5",
    secondary: "#8798D0",
    dark: "#34436F",
    gradient:
      "linear-gradient(180deg, rgba(83,104,165,0.05) 0%, rgba(12,17,35,0.92) 100%)",
  },
};

export const myBooks = [
  {
    id: 1,
    title: "Arjun's Space Adventure",
    cover: "https://res.cloudinary.com/djdct0pxu/image/upload/v1745927791/WONPULSE/pv194jk20wljgqqkr3qn.jpg",
    createdFor: "Arjun",
    type: "premium",
    themeColor: "#7563C9",
    spineDark: "#302454",
    updatedAt: "Edited today",
    progress: 65,
  },
  {
    id: 2,
    title: "The Magical Forest",
    cover: "https://res.cloudinary.com/djdct0pxu/image/upload/v1729076188/WonHubs/cn8gsslrpbg9gueqtd5f.png",
    createdFor: "Sophia",
    type: "free",
    themeColor: "#E69A27",
    spineDark: "#8C4E08",
    updatedAt: "Created yesterday",
    progress: 30,
  },
];