export interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  prefix: string;
  description: string;
  icon: string;
  subcategories: string[];
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'fiction',
    name: 'Fiction',
    slug: 'fiction',
    prefix: 'FIC',
    description: 'Imaginative literature spanning literary works, gripping mysteries, fantasy realms, and thrillers.',
    icon: 'BookOpen',
    subcategories: [
      'Literary',
      'Contemporary',
      'Historical',
      'Mystery & Crime',
      'Thriller & Suspense',
      'Romance',
      'Science Fiction',
      'Fantasy',
      'Horror',
      'Adventure',
      'Humor',
      'Short Stories',
      'Dystopian'
    ]
  },
  {
    id: 'classics',
    name: 'Classics',
    slug: 'classics',
    prefix: 'CLA',
    description: 'Timeless masterpieces of world literature, ancient epics, poetry collections, and legendary drama.',
    icon: 'Scroll',
    subcategories: [
      'World classics',
      'Indian classics',
      'Poetry',
      'Drama & Plays'
    ]
  },
  {
    id: 'non-fiction',
    name: 'Non-Fiction',
    slug: 'non-fiction',
    prefix: 'NF',
    description: 'Captivating real-world stories, memoirs, investigative history, geopolitics, and investigative journalism.',
    icon: 'FileText',
    subcategories: [
      'Biography & Autobiography',
      'Memoir',
      'History',
      'Politics',
      'True Crime',
      'Travel',
      'Essays',
      'Journalism'
    ]
  },
  {
    id: 'science-nature',
    name: 'Science & Nature',
    slug: 'science-nature',
    prefix: 'SCI',
    description: 'Explorations of physics, cosmology, genetics, ecology, earth sciences, and clinical medicine.',
    icon: 'Atom',
    subcategories: [
      'Physics',
      'Chemistry',
      'Biology',
      'Astronomy & Space',
      'Environment',
      'Earth Science',
      'Popular Science',
      'Medicine & Health'
    ]
  },
  {
    id: 'technology-computing',
    name: 'Technology & Computing',
    slug: 'technology-computing',
    prefix: 'TECH',
    description: 'Modern software engineering, AI/ML, cloud systems, cybersecurity, programming, and architecture.',
    icon: 'Cpu',
    subcategories: [
      'Programming',
      'Web Development',
      'Data Science & AI',
      'Databases',
      'Cybersecurity',
      'Cloud & DevOps',
      'Networking',
      'Operating Systems',
      'Software Engineering',
      'Electronics'
    ]
  },
  {
    id: 'engineering-mathematics',
    name: 'Engineering & Mathematics',
    slug: 'engineering-mathematics',
    prefix: 'ENG',
    description: 'Rigorous engineering handbooks, calculus, statistics, linear algebra, and discrete mathematics.',
    icon: 'Binary',
    subcategories: [
      'Mechanical',
      'Civil',
      'Electrical',
      'Electronics & Communication',
      'Chemical',
      'Calculus',
      'Statistics',
      'Discrete Math',
      'Linear Algebra'
    ]
  },
  {
    id: 'business-economics',
    name: 'Business & Economics',
    slug: 'business-economics',
    prefix: 'BIZ',
    description: 'Executive management, startup building, venture investing, global economics, and corporate leadership.',
    icon: 'TrendingUp',
    subcategories: [
      'Management',
      'Entrepreneurship & Startups',
      'Marketing',
      'Finance & Investing',
      'Accounting',
      'Economics',
      'Leadership',
      'Careers'
    ]
  },
  {
    id: 'self-help',
    name: 'Self-Help & Personal Development',
    slug: 'self-help',
    prefix: 'SELF',
    description: 'Transformative guides on habit formation, productivity, communication, mental resilience, and wealth mindset.',
    icon: 'Sparkles',
    subcategories: [
      'Productivity',
      'Motivation',
      'Habits',
      'Mindfulness',
      'Relationships',
      'Communication',
      'Money Mindset'
    ]
  },
  {
    id: 'philosophy-psychology-religion',
    name: 'Philosophy, Psychology & Religion',
    slug: 'philosophy-psychology-religion',
    prefix: 'PHIL',
    description: 'Inquiries into human consciousness, ethical doctrines, world theological philosophies, and eastern thought.',
    icon: 'Compass',
    subcategories: [
      'Western and Eastern philosophy',
      'Psychology',
      'Sociology',
      'Spirituality',
      'Hinduism',
      'Buddhism',
      'Islam',
      'Christianity',
      'Sikhism'
    ]
  },
  {
    id: 'arts-hobbies',
    name: 'Arts & Hobbies',
    slug: 'arts-hobbies',
    prefix: 'ART',
    description: 'Creative design, fine art history, cinema, architecture, photographic technique, crafts, and games.',
    icon: 'Palette',
    subcategories: [
      'Art & Design',
      'Photography',
      'Music',
      'Film & Theatre',
      'Architecture',
      'Fashion',
      'Crafts',
      'Gardening',
      'Games'
    ]
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    slug: 'lifestyle',
    prefix: 'LIFE',
    description: 'Nutritional culinary arts, yoga regimes, holistic athletic conditioning, interior decor, and parenting.',
    icon: 'Coffee',
    subcategories: [
      'Cooking & Food',
      'Health & Fitness',
      'Yoga & Wellness',
      'Parenting',
      'Home & Decor',
      'Pets',
      'Sports'
    ]
  },
  {
    id: 'childrens-books',
    name: "Children's Books",
    slug: 'childrens-books',
    prefix: 'CHLD',
    description: 'Illustrated picture books, early phonic readers, middle-grade adventures, and interactive learning titles.',
    icon: 'Smile',
    subcategories: [
      'Picture Books',
      'Early Readers',
      'Middle Grade',
      'Fairy Tales',
      'Educational',
      'Activity Books'
    ]
  },
  {
    id: 'young-adult',
    name: 'Young Adult',
    slug: 'young-adult',
    prefix: 'YA',
    description: 'Coming-of-age fiction, teenage dystopian epics, urban fantasy, and passionate young romances.',
    icon: 'Flame',
    subcategories: [
      'Fiction',
      'Fantasy',
      'Romance',
      'Coming-of-Age',
      'Dystopian'
    ]
  },
  {
    id: 'comics-manga-graphic-novels',
    name: 'Comics, Manga & Graphic Novels',
    slug: 'comics-manga-graphic-novels',
    prefix: 'COM',
    description: 'Superhero serials, acclaimed Japanese manga, graphic memoirs, indie comic art, and Indian mythic comics.',
    icon: 'Layers',
    subcategories: [
      'Superhero',
      'Manga',
      'Indie',
      'Graphic Memoirs',
      'Indian comics'
    ]
  },
  {
    id: 'education-exam-prep',
    name: 'Education & Exam Prep',
    slug: 'education-exam-prep',
    prefix: 'EXAM',
    description: 'Comprehensive guides and question banks for GATE, JEE, NEET, UPSC Civil Services, CAT, and GRE.',
    icon: 'GraduationCap',
    subcategories: [
      'GATE',
      'JEE',
      'NEET',
      'UPSC/Civil Services',
      'CAT',
      'GRE/GMAT',
      'SSC',
      'Banking',
      'CBSE/NCERT',
      'Competitive Programming',
      'Language Learning'
    ]
  },
  {
    id: 'languages-literature',
    name: 'Languages & Literature',
    slug: 'languages-literature',
    prefix: 'LANG',
    description: 'Original Indian and international language literature spanning Hindi, Sanskrit, Urdu, Bengali, French, and Japanese.',
    icon: 'Languages',
    subcategories: [
      'Hindi',
      'English',
      'Sanskrit',
      'Urdu',
      'Bengali',
      'Tamil',
      'Telugu',
      'Marathi',
      'Punjabi',
      'Gujarati',
      'Malayalam',
      'Kannada',
      'Spanish',
      'French',
      'German',
      'Japanese'
    ]
  },
  {
    id: 'law-government-reference',
    name: 'Law, Government & Reference',
    slug: 'law-government-reference',
    prefix: 'LAW',
    description: 'Constitutional law treatises, jurisprudence, judicial commentary, atlases, encyclopedias, and research methods.',
    icon: 'Scale',
    subcategories: [
      'Indian Constitution',
      'Law',
      'Dictionaries',
      'Encyclopedias',
      'Atlases',
      'Research Methods',
      'Academic Writing'
    ]
  },
  {
    id: 'indian-authors-culture',
    name: 'Indian Authors & Culture',
    slug: 'indian-authors-culture',
    prefix: 'IND',
    description: 'Indian English writing, translations, civilizational history, Ramayana & Mahabharata epics, and political analysis.',
    icon: 'Landmark',
    subcategories: [
      'Indian English fiction',
      'Regional literature in translation',
      'Indian history',
      'Mythology (Ramayana, Mahabharata, Puranas)',
      'Indian politics'
    ]
  },
  {
    id: 'audiobook-ebook-previews',
    name: 'Audiobook & E-book Previews',
    slug: 'audiobook-ebook-previews',
    prefix: 'PREV',
    description: 'Curated digital editions featuring instant Google Books interactive sample previews and e-book editions.',
    icon: 'Headphones',
    subcategories: [
      'Fiction Previews',
      'Non-Fiction Previews',
      'Academic Previews',
      'Young Adult Previews'
    ]
  },
  {
    id: 'magazines-journals-annuals',
    name: 'Magazines, Journals & Annuals',
    slug: 'magazines-journals-annuals',
    prefix: 'MAG',
    description: 'Periodical anthologies, IEEE and ACM proceedings, scientific review digests, and literary journals.',
    icon: 'Newspaper',
    subcategories: [
      'Popular Science Journals',
      'Business & Finance Reviews',
      'Literature & Arts Reviews',
      'Technology Digests'
    ]
  }
];

export const CATEGORY_MAP = new Map<string, CategoryDefinition>(
  CATEGORIES.map((cat) => [cat.name, cat])
);

export const CATEGORY_SLUG_MAP = new Map<string, CategoryDefinition>(
  CATEGORIES.map((cat) => [cat.slug, cat])
);
