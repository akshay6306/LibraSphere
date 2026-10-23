import { PrismaClient } from '@prisma/client';

// String constants replacing Prisma enums (SQLite doesn't support enums)
const Role = { ADMIN: 'ADMIN', LIBRARIAN: 'LIBRARIAN', MEMBER: 'MEMBER' } as const;
const CopyStatus = { AVAILABLE: 'AVAILABLE', BORROWED: 'BORROWED', RESERVED: 'RESERVED', LOST: 'LOST', DAMAGED: 'DAMAGED' } as const;
const LoanStatus = { ACTIVE: 'ACTIVE', RETURNED: 'RETURNED', OVERDUE: 'OVERDUE' } as const;
const ReservationStatus = { PENDING: 'PENDING', READY: 'READY', FULFILLED: 'FULFILLED', CANCELLED: 'CANCELLED', EXPIRED: 'EXPIRED' } as const;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'Technology',
  'History',
  'Philosophy',
  'Art',
  'Mathematics',
  'Engineering',
  'Medicine'
];

const BOOK_TEMPLATES: Record<string, { titles: string[]; authors: string[]; publishers: string[] }> = {
  Fiction: {
    titles: [
      'The Great Gatsby', 'To Kill a Mockingbird', '1984', 'Pride and Prejudice', 'The Catcher in the Rye',
      'The Hobbit', 'Fahrenheit 451', 'Jane Eyre', 'Animal Farm', 'Brave New World',
      'The Lord of the Rings', 'Crime and Punishment', 'Wuthering Heights', 'The Odyssey', 'Frankenstein',
      'One Hundred Years of Solitude', 'The Brothers Karamazov', 'War and Peace', 'Madame Bovary', 'The Picture of Dorian Gray'
    ],
    authors: ['F. Scott Fitzgerald', 'Harper Lee', 'George Orwell', 'Jane Austen', 'J.D. Salinger', 'J.R.R. Tolkien', 'Ray Bradbury', 'Charlotte Brontë', 'Aldous Huxley', 'Fyodor Dostoevsky'],
    publishers: ['Scribner', 'J.B. Lippincott & Co.', 'Secker & Warburg', 'T. Egerton', 'Little, Brown', 'George Allen & Unwin', 'Ballantine Books', 'Smith, Elder & Co.']
  },
  'Non-Fiction': {
    titles: [
      'Sapiens: A Brief History of Humankind', 'Educated', 'Becoming', 'The Immortal Life of Henrietta Lacks', 'Quiet: The Power of Introverts',
      'Thinking, Fast and Slow', 'Atomic Habits', 'The Power of Habit', 'Guns, Germs, and Steel', 'Into the Wild',
      'Outliers: The Story of Success', 'Bad Blood: Secrets and Lies', 'Born a Crime', 'When Breath Becomes Air', 'The Wright Brothers',
      'Say Nothing', 'The Splendid and the Vile', 'Killers of the Flower Moon', 'A Short History of Nearly Everything', 'Man’s Search for Meaning'
    ],
    authors: ['Yuval Noah Harari', 'Tara Westover', 'Michelle Obama', 'Rebecca Skloot', 'Susan Cain', 'Daniel Kahneman', 'James Clear', 'Charles Duhigg', 'Jared Diamond', 'Jon Krakauer'],
    publishers: ['Harper', 'Random House', 'Crown', 'Broadway Books', 'Farrar, Straus and Giroux', 'Avery', 'W. W. Norton & Company']
  },
  Science: {
    titles: [
      'A Brief History of Time', 'Cosmos', 'The Selfish Gene', 'Astrophysics for People in a Hurry', 'The Gene: An Intimate History',
      'The Elegant Universe', 'Silent Spring', 'What If?: Serious Scientific Answers', 'The Fabric of the Cosmos', 'Six Easy Pieces',
      'The Order of Time', 'The Demon-Haunted World', 'Origin of Species', 'The Structure of Scientific Revolutions', 'Until the End of Time',
      'The Body: A Guide for Occupants', 'Chaos: Making a New Science', 'Seven Brief Lessons on Physics', 'The Hidden Life of Trees', 'Parallel Worlds'
    ],
    authors: ['Stephen Hawking', 'Carl Sagan', 'Richard Dawkins', 'Neil deGrasse Tyson', 'Siddhartha Mukherjee', 'Brian Greene', 'Rachel Carson', 'Randall Munroe', 'Carlo Rovelli', 'Charles Darwin'],
    publishers: ['Bantam Books', 'Ballantine Books', 'Oxford University Press', 'W. W. Norton', 'Scribner', 'Vintage', 'Houghton Mifflin']
  },
  Technology: {
    titles: [
      'Clean Code', 'The Pragmatic Programmer', 'Design Patterns: Elements of Reusable Object-Oriented Software', 'Introduction to Algorithms', 'Structure and Interpretation of Computer Programs',
      'Designing Data-Intensive Applications', 'Refactoring', 'The Mythical Man-Month', 'Code Complete', 'Artificial Intelligence: A Modern Approach',
      'Site Reliability Engineering', 'You Don’t Know JS', 'Grokking Algorithms', 'Clean Architecture', 'Continuous Delivery',
      'Domain-Driven Design', 'Computer Networks', 'Operating System Concepts', 'Cracking the Coding Interview', 'Compilers: Principles, Techniques, and Tools'
    ],
    authors: ['Robert C. Martin', 'Andrew Hunt', 'Erich Gamma', 'Thomas H. Cormen', 'Harold Abelson', 'Martin Kleppmann', 'Martin Fowler', 'Fred Brooks', 'Steve McConnell', 'Stuart Russell'],
    publishers: ['Prentice Hall', 'Addison-Wesley', 'O’Reilly Media', 'MIT Press', 'Pearson', 'Microsoft Press', 'Manning Publications']
  },
  History: {
    titles: [
      'The Silk Roads: A New History of the World', 'SPQR: A History of Ancient Rome', 'The Guns of August', 'A People’s History of the United States', 'Postwar: A History of Europe Since 1945',
      'Team of Rivals', 'The Crusades: The Authoritative History', 'The Rise and Fall of the Third Reich', 'Genghis Khan and the Making of the Modern World', '1776',
      'The Peloponnesian War', 'Collapse: How Societies Choose to Fail or Succeed', 'Battle Cry of Freedom', 'The Warmth of Other Suns', 'The Sleepwalkers: How Europe Went to War in 1914',
      'Iron Curtain: The Crushing of Eastern Europe', 'Emperor of All Maladies', 'Rubicon: The Triumph and Tragedy of the Roman Republic', 'The Anarchy: The Relentless Rise of the East India Company', 'Jerusalem: The Biography'
    ],
    authors: ['Peter Frankopan', 'Mary Beard', 'Barbara W. Tuchman', 'Howard Zinn', 'Tony Judt', 'Doris Kearns Goodwin', 'Thomas Asbridge', 'William L. Shirer', 'Jack Weatherford', 'David McCullough'],
    publishers: ['Bloomsbury', 'Profile Books', 'Macmillan', 'Harper Perennial', 'Penguin Books', 'Simon & Schuster', 'Oxford University Press']
  },
  Philosophy: {
    titles: [
      'Meditations', 'The Republic', 'Beyond Good and Evil', 'Critique of Pure Reason', 'Being and Time',
      'Ethics', 'Discourse on Method', 'The Myth of Sisyphus', 'Tractatus Logico-Philosophicus', 'Simulacra and Simulation',
      'Justice: What’s the Right Thing to Do?', 'The Nicomachean Ethics', 'Leviathan', 'The Prince', 'A Treatise of Human Nature',
      'Thus Spoke Zarathustra', 'The Phenomenology of Spirit', 'The World as Will and Representation', 'Existentialism is a Humanism', 'Utilitarianism'
    ],
    authors: ['Marcus Aurelius', 'Plato', 'Friedrich Nietzsche', 'Immanuel Kant', 'Martin Heidegger', 'Baruch Spinoza', 'René Descartes', 'Albert Camus', 'Ludwig Wittgenstein', 'Michael J. Sandel'],
    publishers: ['Penguin Classics', 'Oxford World’s Classics', 'Cambridge University Press', 'Hackett Publishing', 'Routledge', 'Harvard University Press']
  },
  Art: {
    titles: [
      'The Story of Art', 'Ways of Seeing', 'Interaction of Color', 'Concerning the Spiritual in Art', 'The Letters of Vincent van Gogh',
      'Art and Illusion', 'Leonardo da Vinci', 'Just Kids', 'The Shock of the New', 'On Photography',
      'History of Modern Art', 'Design as Art', 'How to Read a Painting', 'The Andy Warhol Diaries', 'Thinking with Type',
      'The Visual Display of Quantitative Information', 'The Painted Word', 'Secret Knowledge', 'Drawing on the Right Side of the Brain', 'The Artist’s Way'
    ],
    authors: ['E.H. Gombrich', 'John Berger', 'Josef Albers', 'Wassily Kandinsky', 'Vincent van Gogh', 'Walter Isaacson', 'Patti Smith', 'Robert Hughes', 'Susan Sontag', 'Edward Tufte'],
    publishers: ['Phaidon Press', 'Penguin Books', 'Yale University Press', 'Dover Publications', 'Simon & Schuster', 'Thames & Hudson', 'Graphics Press']
  },
  Mathematics: {
    titles: [
      'Gödel, Escher, Bach: An Eternal Golden Braid', 'The Princeton Companion to Mathematics', 'Fermat’s Enigma', 'Linear Algebra Done Right', 'Calculus: Early Transcendentals',
      'Concrete Mathematics', 'Principles of Mathematical Analysis', 'How Not to Be Wrong: The Power of Mathematical Thinking', 'Infinite Powers', 'The Joy of x',
      'Topology', 'Abstract Algebra', 'Probability Theory: The Logic of Science', 'Prime Obsession', 'A Mathematician’s Apology',
      'Proofs from THE BOOK', 'Real and Complex Analysis', 'Differential Equations and Linear Algebra', 'Discrete Mathematics and Its Applications', 'The Music of the Primes'
    ],
    authors: ['Douglas Hofstadter', 'Timothy Gowers', 'Simon Singh', 'Sheldon Axler', 'James Stewart', 'Ronald L. Graham', 'Walter Rudin', 'Jordan Ellenberg', 'Steven Strogatz', 'G.H. Hardy'],
    publishers: ['Basic Books', 'Princeton University Press', 'Springer', 'Cengage Learning', 'Addison-Wesley', 'McGraw-Hill', 'Penguin Books']
  },
  Engineering: {
    titles: [
      'To Engineer Is Human: The Role of Failure in Successful Design', 'Structures: Or Why Things Don’t Fall Down', 'The Design of Everyday Things', 'Fundamentals of Electric Circuits', 'Engineering Mechanics: Statics & Dynamics',
      'Mechanical Engineering Design', 'Chemical Engineering Thermodynamics', 'Introduction to Flight', 'Materials Science and Engineering', 'Control Systems Engineering',
      'Feedback Control of Dynamic Systems', 'Civil Engineering: A Very Short Introduction', 'Robotics, Vision and Control', 'Thermal Physics', 'Fluid Mechanics',
      'Modern Control Systems', 'Digital Design: Principles and Practices', 'Aerodynamics for Engineers', 'Biomedical Engineering Fundamentals', 'The Existential Pleasures of Engineering'
    ],
    authors: ['Henry Petroski', 'J.E. Gordon', 'Don Norman', 'Charles K. Alexander', 'R.C. Hibbeler', 'Joseph E. Shigley', 'J.M. Smith', 'John D. Anderson', 'William D. Callister', 'Norman S. Nise'],
    publishers: ['St. Martin’s Press', 'Da Capo Press', 'Basic Books', 'McGraw-Hill', 'Pearson', 'Wiley', 'CRC Press', 'Oxford University Press']
  },
  Medicine: {
    titles: [
      'The Emperor of All Maladies: A Biography of Cancer', 'Harrison’s Principles of Internal Medicine', 'Guyton and Hall Textbook of Medical Physiology', 'Robbins and Cotran Pathologic Basis of Disease', 'Gray’s Anatomy for Students',
      'Complications: A Surgeon’s Notes on an Imperfect Science', 'Being Mortal: Medicine and What Matters in the End', 'The Checklist Manifesto', 'Netter’s Atlas of Human Anatomy', 'Bates’ Guide to Physical Examination',
      'First Aid for the USMLE Step 1', 'Goodman and Gilman’s The Pharmacological Basis of Therapeutics', 'Internal Medicine Essentials', 'Oxford Handbook of Clinical Medicine', 'Kaplan Medical USMLE Master the Boards',
      'Case Files Internal Medicine', 'Current Medical Diagnosis and Treatment', 'Pathoma: Fundamentals of Pathology', 'Emergency Medicine Secrets', 'The House of God'
    ],
    authors: ['Siddhartha Mukherjee', 'J. Larry Jameson', 'John E. Hall', 'Vinay Kumar', 'Richard Drake', 'Atul Gawande', 'Frank H. Netter', 'Lynn S. Bickley', 'Tao Le', 'Samuel Shem'],
    publishers: ['Scribner', 'McGraw-Hill Education', 'Elsevier', 'Metropolitan Books', 'Wolters Kluwer', 'Oxford University Press', 'Lippincott Williams & Wilkins']
  }
};

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Settings
  console.log('Seeding settings...');
  const settingsData = [
    { key: 'loanPeriodDays', value: '14' },
    { key: 'maxBooksPerMember', value: '5' },
    { key: 'finePerDay', value: '5' },
    { key: 'gracePeriod', value: '2' },
    { key: 'maxRenewals', value: '2' },
    { key: 'fineThreshold', value: '500' },
    { key: 'holdPeriodHours', value: '48' }
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s
    });
  }

  // Passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const librarianPasswordHash = await bcrypt.hash('Librarian@123', 10);
  const memberPasswordHash = await bcrypt.hash('Member@123', 10);

  // 2. Admin
  console.log('Seeding Admin...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@libra.test' },
    update: {},
    create: {
      email: 'admin@libra.test',
      password: adminPasswordHash,
      name: 'Chief Administrator',
      phone: '+1-555-0100',
      role: Role.ADMIN,
      isActive: true
    }
  });

  // 3. Branches
  console.log('Seeding Branches & Librarians...');
  const branchConfigs = [
    { name: 'Central Library', address: '100 University Avenue, Metro City', phone: '+1-555-0111', email: 'central@libra.test' },
    { name: 'North Campus Library', address: '450 North Hill Road, North Campus', phone: '+1-555-0112', email: 'north@libra.test' },
    { name: 'South Campus Library', address: '820 South Harbor Blvd, South Campus', phone: '+1-555-0113', email: 'south@libra.test' }
  ];

  const branches = [];
  const librarians = [];

  const librarianEmails = [
    { email: 'librarian@libra.test', name: 'Eleanor Vance (Head Librarian)' },
    { email: 'librarian2@libra.test', name: 'Marcus Brody (North Branch)' },
    { email: 'librarian3@libra.test', name: 'Dr. Clara Oswald (South Branch)' }
  ];

  for (let i = 0; i < 3; i++) {
    const libUser = await prisma.user.upsert({
      where: { email: librarianEmails[i].email },
      update: {},
      create: {
        email: librarianEmails[i].email,
        password: librarianPasswordHash,
        name: librarianEmails[i].name,
        phone: `+1-555-012${i + 1}`,
        role: Role.LIBRARIAN,
        isActive: true
      }
    });
    librarians.push(libUser);

    const branch = await prisma.branch.upsert({
      where: { id: `branch-${i + 1}` },
      update: {},
      create: {
        id: `branch-${i + 1}`,
        name: branchConfigs[i].name,
        address: branchConfigs[i].address,
        phone: branchConfigs[i].phone,
        email: branchConfigs[i].email,
        isActive: true,
        managerId: libUser.id
      }
    });
    branches.push(branch);
  }

  // 4. 30 Members
  console.log('Seeding 30 Members...');
  const memberFirstNames = [
    'Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia',
    'Kevin', 'Laura', 'Michael', 'Nora', 'Oliver', 'Penelope', 'Quinn', 'Robert', 'Sophia', 'Thomas',
    'Uma', 'Victor', 'Wendy', 'Xavier', 'Yasmine', 'Zachary', 'Arthur', 'Beatrice', 'Caleb', 'David'
  ];
  const memberLastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
  ];

  const members = [];
  for (let i = 0; i < 30; i++) {
    const isFirst = i === 0;
    const email = isFirst ? 'member@libra.test' : `member${i + 1}@libra.test`;
    const name = isFirst ? 'John Member' : `${memberFirstNames[i]} ${memberLastNames[i]}`;
    const membershipId = `LIB-${1000 + i + 1}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: memberPasswordHash,
        name,
        phone: `+1-555-02${i.toString().padStart(2, '0')}`,
        role: Role.MEMBER,
        isActive: true
      }
    });

    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const member = await prisma.member.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        membershipId,
        address: `${100 + i * 12} Maple Street, Suite ${i + 1}, Metro City`,
        dateOfBirth: new Date(1985 + (i % 20), (i * 3) % 12, (i * 7) % 28 + 1),
        membershipExpiry: oneYearLater,
        totalFines: 0,
        isEmailVerified: true
      }
    });
    members.push({ user, member });
  }

  // 5. 200 Books across 10 categories
  console.log('Seeding 200 Books and Copies...');
  const books = [];
  const bookCopies = [];
  let bookCounter = 1;

  for (const category of CATEGORIES) {
    const template = BOOK_TEMPLATES[category];
    for (let j = 0; j < 20; j++) {
      const titleIndex = j % template.titles.length;
      const titlePrefix = j >= template.titles.length ? `Vol. ${Math.floor(j / template.titles.length) + 1}: ` : '';
      const title = `${titlePrefix}${template.titles[titleIndex]}`;
      const author = template.authors[j % template.authors.length];
      const publisher = template.publishers[j % template.publishers.length];
      const publishedYear = 1970 + ((j * 3 + category.length * 5) % 54);
      const pages = 180 + ((j * 37) % 650);
      const price = parseFloat((14.99 + ((j * 7) % 45)).toFixed(2));
      const isbn = `978-${Math.floor(100 + j * 4)}-${Math.floor(10000 + bookCounter * 23)}-${bookCounter % 10}`;

      const book = await prisma.book.upsert({
        where: { isbn },
        update: {},
        create: {
          id: `book-${bookCounter}`,
          isbn,
          title,
          author,
          publisher,
          publishedYear,
          category,
          description: `A masterclass in ${category.toLowerCase()} literature exploring profound concepts, innovative theories, and enduring perspectives on ${title.toLowerCase()}. Essential reading for scholars and enthusiasts alike.`,
          coverUrl: null, // Frontend provides dynamic category gradients
          language: 'English',
          pages,
          price
        }
      });
      books.push(book);

      // Create 3-5 copies per book distributed across branches
      const copyCount = 3 + (bookCounter % 3); // 3, 4, or 5 copies
      for (let c = 0; c < copyCount; c++) {
        const branchIndex = c % branches.length;
        const branch = branches[branchIndex];
        const barcode = `BC-${bookCounter.toString().padStart(4, '0')}-${c + 1}`;
        const shelfLocation = `Floor ${(branchIndex + 1)}-Aisle ${category.charAt(0)}${c + 1}-Section ${Math.floor(j / 4) + 1}`;

        const copy = await prisma.bookCopy.upsert({
          where: { barcode },
          update: {},
          create: {
            id: `copy-${bookCounter}-${c + 1}`,
            bookId: book.id,
            branchId: branch.id,
            barcode,
            status: CopyStatus.AVAILABLE,
            shelfLocation,
            version: 1
          }
        });
        bookCopies.push(copy);
      }

      bookCounter++;
    }
  }

  console.log(`Generated ${books.length} books and ${bookCopies.length} copies.`);

  // 6. 100 Historical Loans (Mix of RETURNED, ACTIVE, OVERDUE)
  console.log('Seeding 100 historical loans with fines...');
  const now = new Date();

  // We'll create:
  // 55 RETURNED loans
  // 30 ACTIVE loans (due in 5-12 days)
  // 15 OVERDUE loans (due 3-20 days ago)
  let loanIndex = 1;

  for (let i = 0; i < 100; i++) {
    const copy = bookCopies[i % bookCopies.length];
    const memberObj = members[i % members.length];
    const librarian = librarians[i % librarians.length];
    const branch = branches[i % branches.length];

    let status: LoanStatus;
    let issuedAt: Date;
    let dueDate: Date;
    let returnedAt: Date | null = null;
    let conditionNote: string | null = null;

    if (i < 55) {
      // Returned loan
      status = LoanStatus.RETURNED;
      issuedAt = new Date(now.getTime() - (45 + i) * 24 * 60 * 60 * 1000);
      dueDate = new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      returnedAt = new Date(dueDate.getTime() - Math.floor(Math.random() * 4) * 24 * 60 * 60 * 1000);
      conditionNote = i % 10 === 0 ? 'Minor spine wear noted upon return' : null;
    } else if (i < 85) {
      // Active loan
      status = LoanStatus.ACTIVE;
      issuedAt = new Date(now.getTime() - (i % 7 + 1) * 24 * 60 * 60 * 1000);
      dueDate = new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      returnedAt = null;
      // Mark copy as borrowed
      await prisma.bookCopy.update({
        where: { id: copy.id },
        data: { status: CopyStatus.BORROWED }
      });
    } else {
      // Overdue loan
      status = LoanStatus.OVERDUE;
      const overdueDays = (i - 84) * 2 + 2; // 2 to 32 days overdue
      issuedAt = new Date(now.getTime() - (14 + overdueDays) * 24 * 60 * 60 * 1000);
      dueDate = new Date(now.getTime() - overdueDays * 24 * 60 * 60 * 1000);
      returnedAt = null;
      conditionNote = 'Notice sent to member regarding overdue status';
      // Mark copy as borrowed
      await prisma.bookCopy.update({
        where: { id: copy.id },
        data: { status: CopyStatus.BORROWED }
      });
    }

    const loan = await prisma.loan.upsert({
      where: { id: `loan-${loanIndex}` },
      update: {},
      create: {
        id: `loan-${loanIndex}`,
        copyId: copy.id,
        memberId: memberObj.member.id,
        librarianId: librarian.id,
        branchId: branch.id,
        issuedAt,
        dueDate,
        returnedAt,
        renewalCount: i % 4 === 0 ? 1 : 0,
        status,
        conditionNote,
        idempotencyKey: `seed-loan-${loanIndex}`
      }
    });

    // Overdue loans get fines
    if (status === LoanStatus.OVERDUE) {
      const overdueDays = Math.max(1, Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000)));
      const fineAmount = overdueDays * 5; // $5/day
      const isPaid = i % 2 === 0;

      const fine = await prisma.fine.create({
        data: {
          id: `fine-${loanIndex}`,
          loanId: loan.id,
          memberId: memberObj.member.id,
          amount: fineAmount,
          reason: `Overdue book return (${overdueDays} days past due date)`,
          isPaid,
          createdAt: new Date(dueDate.getTime() + 1 * 24 * 60 * 60 * 1000)
        }
      });

      if (isPaid) {
        await prisma.payment.create({
          data: {
            fineId: fine.id,
            memberId: memberObj.member.id,
            amount: fineAmount,
            method: 'CARD',
            transactionId: `TXN-${100000 + loanIndex}`,
            paidAt: now
          }
        });
      } else {
        await prisma.member.update({
          where: { id: memberObj.member.id },
          data: { totalFines: { increment: fineAmount } }
        });
      }
    }

    loanIndex++;
  }

  // 7. Seed Reservations
  console.log('Seeding Reservations...');
  for (let r = 0; r < 12; r++) {
    const book = books[r * 5];
    const memberObj = members[(r + 5) % members.length];
    const branch = branches[r % branches.length];
    const isReady = r === 0 || r === 1;

    await prisma.reservation.create({
      data: {
        id: `res-${r + 1}`,
        bookId: book.id,
        memberId: memberObj.member.id,
        branchId: branch.id,
        status: isReady ? ReservationStatus.READY : ReservationStatus.PENDING,
        requestedAt: new Date(now.getTime() - (r + 1) * 24 * 60 * 60 * 1000),
        readyAt: isReady ? now : null,
        expiresAt: isReady ? new Date(now.getTime() + 48 * 60 * 60 * 1000) : null,
        queuePosition: isReady ? 1 : (r % 3) + 1
      }
    });
  }

  // 8. Seed Reviews
  console.log('Seeding Reviews...');
  const sampleComments = [
    'An extraordinary masterpiece of intellectual depth and narrative brilliance!',
    'Essential reading for anyone interested in this topic. Highly recommended.',
    'Clear, articulate, and immensely practical. Finished it in two days.',
    'Thought-provoking and beautifully written from cover to cover.',
    'A foundational text that changed how I approach my daily work and thinking.'
  ];

  for (let rev = 0; rev < 25; rev++) {
    const book = books[rev % 15];
    const memberObj = members[rev % members.length];
    await prisma.review.create({
      data: {
        bookId: book.id,
        memberId: memberObj.member.id,
        rating: 4 + (rev % 2),
        comment: sampleComments[rev % sampleComments.length],
        createdAt: new Date(now.getTime() - (rev * 2) * 24 * 60 * 60 * 1000)
      }
    });
  }

  // 9. Seed Wishlists
  console.log('Seeding Wishlists...');
  for (let w = 0; w < 15; w++) {
    const book = books[(w * 7) % books.length];
    const memberObj = members[w % 5];
    await prisma.wishlist.upsert({
      where: {
        memberId_bookId: {
          memberId: memberObj.member.id,
          bookId: book.id
        }
      },
      update: {},
      create: {
        memberId: memberObj.member.id,
        bookId: book.id
      }
    });
  }

  // 10. Seed Notifications
  console.log('Seeding Notifications...');
  for (let n = 0; n < members.length; n++) {
    const user = members[n].user;
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'WELCOME',
        title: 'Welcome to LibraSphere!',
        message: 'Your library membership is active. Explore our 200+ curated volumes and reserve books anytime.',
        isRead: n > 5
      }
    });
  }

  // 11. Seed Audit Logs
  console.log('Seeding Audit Logs...');
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'SYSTEM',
      entityId: 'SEED_001',
      details: 'System database successfully initialized with initial catalog and seed data.',
      ipAddress: '127.0.0.1'
    }
  });

  console.log('=== Database Seeding Completed Successfully! ===');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
