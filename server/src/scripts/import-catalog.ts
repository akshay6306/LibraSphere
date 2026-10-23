import { PrismaClient } from '@prisma/client';
import { CATEGORIES } from '../config/categories';
import { CURATED_CATALOG } from './catalog-data';
import { generateCategoryBooks, generateValidIsbn13, BookBlueprint } from './catalog-builder';
import { buildAmazonUrl, buildGooglePreviewUrl } from '../lib/amazon';

const prisma = new PrismaClient();

async function main() {
  console.log('===============================================================');
  console.log('      LibraSphere Catalog Expansion Pipeline (2,000+ Books)    ');
  console.log('===============================================================\n');

  // 1. Fetch branches for physical copy distribution
  const branches = await prisma.branch.findMany({ where: { isActive: true } });
  if (branches.length === 0) {
    console.error('No active branches found. Please seed branches first.');
    process.exit(1);
  }
  console.log(`Found ${branches.length} active branches: ${branches.map((b) => b.name).join(', ')}`);

  const TARGET_PER_CATEGORY = 105; // 20 categories * 105 = 2,100 books!
  let totalImported = 0;
  let totalCopiesCreated = 0;

  for (let catIdx = 0; catIdx < CATEGORIES.length; catIdx++) {
    const cat = CATEGORIES[catIdx];
    console.log(`\nProcessing Category [${catIdx + 1}/20]: ${cat.name} (${cat.prefix})...`);

    // Merge explicitly curated items
    const curatedItems = CURATED_CATALOG.filter((b) => b.category === cat.name);
    const categoryBooks = generateCategoryBooks(cat.name, cat.subcategories, TARGET_PER_CATEGORY);

    // Merge with curated items taking precedence
    const combinedBlueprints: {
      isbn?: string;
      title: string;
      author: string;
      publisher: string;
      subcategory: string;
      year: number;
      pages: number;
      price: number;
      description: string;
      coverUrl?: string;
      language?: string;
      format?: string;
      seriesName?: string;
      seriesNumber?: string;
      edition?: string;
      ageRange?: string;
      rating?: number;
      previewUrl?: string;
    }[] = [];

    // Add curated items first
    for (const cur of curatedItems) {
      combinedBlueprints.push({
        isbn: cur.isbn,
        title: cur.title,
        author: cur.author,
        publisher: cur.publisher,
        subcategory: cur.subcategory,
        year: cur.publishedYear,
        pages: cur.pages || 320,
        price: cur.price || 19.99,
        description: cur.description,
        coverUrl: cur.coverUrl,
        language: cur.language || 'en',
        format: cur.format || 'Paperback',
        seriesName: cur.seriesName,
        seriesNumber: cur.seriesNumber,
        edition: cur.edition,
        ageRange: cur.ageRange,
        rating: cur.rating || 4.8,
        previewUrl: cur.previewUrl
      });
    }

    // Add generated books up to target
    for (const gen of categoryBooks) {
      if (combinedBlueprints.length >= TARGET_PER_CATEGORY) break;
      if (!combinedBlueprints.some((b) => b.title === gen.title)) {
        combinedBlueprints.push(gen);
      }
    }

    // Safety top-up if any category is below target
    let topUpCounter = 1;
    while (combinedBlueprints.length < TARGET_PER_CATEGORY) {
      const subcat = cat.subcategories[topUpCounter % cat.subcategories.length];
      const title = `${cat.name} Studies: A Comprehensive Guide to ${subcat} (Vol. ${topUpCounter})`;
      combinedBlueprints.push({
        title,
        author: `Prof. ${cat.prefix} Scholar ${topUpCounter}`,
        publisher: 'University Press',
        subcategory: subcat,
        year: 2020 + (topUpCounter % 5),
        pages: 320,
        price: 19.99,
        description: `Authoritative compendium in ${cat.name} focusing on foundational aspects of ${subcat}.`,
        language: cat.name === 'Languages & Literature' ? 'hi' : 'en',
        format: 'Paperback',
        rating: 4.5
      });
      topUpCounter++;
    }

    console.log(`  -> Importing ${combinedBlueprints.length} books for ${cat.name}...`);

    for (let itemIdx = 0; itemIdx < combinedBlueprints.length; itemIdx++) {
      const item = combinedBlueprints[itemIdx];
      // Generate valid ISBN-13 if not explicitly provided
      const isbn = item.isbn || generateValidIsbn13(catIdx + 100, itemIdx + 1);

      // Cover URL: Use explicit cover or Open Library cover
      const coverUrl =
        item.coverUrl || `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

      const amazonUrl = buildAmazonUrl(isbn, item.title, item.author);
      const previewUrl =
        item.previewUrl || buildGooglePreviewUrl(isbn);

      // Derive badges: ~5% new arrivals, ~10% staff picks
      const isNewArrival = itemIdx % 20 === 0;
      const isStaffPick = itemIdx % 10 === 3;
      const rating = item.rating || parseFloat((4.1 + ((itemIdx * 7) % 9) / 10).toFixed(1));
      const ratingCount = 20 + ((itemIdx * 89) % 3500);

      // Upsert Book
      const bookData = {
        title: item.title,
        author: item.author,
        publisher: item.publisher,
        publishedYear: item.year,
        category: cat.name,
        subcategory: item.subcategory || cat.subcategories[0],
        description: item.description,
        coverUrl,
        language: item.language || 'English',
        pages: item.pages,
        price: item.price,
        format: item.format || 'Paperback',
        seriesName: item.seriesName || null,
        seriesNumber: item.seriesNumber || null,
        edition: item.edition || null,
        isNewArrival,
        isStaffPick,
        previewUrl,
        amazonUrl,
        rating,
        ratingCount,
        ageRange: item.ageRange || null
      };

      const book = await prisma.book.upsert({
        where: { isbn },
        update: bookData,
        create: {
          isbn,
          ...bookData
        }
      });
      totalImported++;

      // Create physical copies: 1 to 5 copies distributed across branches
      // Weighted by rating / popularity
      const copyCount = rating >= 4.8 ? 4 : rating >= 4.5 ? 3 : 2;

      for (let c = 0; c < copyCount; c++) {
        const branch = branches[(catIdx + c) % branches.length];
        const barcode = `${cat.prefix}-${(itemIdx + 1).toString().padStart(4, '0')}-${c + 1}`;
        const shelfLocation = `Floor ${(c % 3) + 1}-Aisle ${cat.prefix}${Math.floor(itemIdx / 25) + 1}-Section ${(c + 1)}`;
        const status = c === 0 && itemIdx % 5 === 0 ? 'BORROWED' : 'AVAILABLE';

        await prisma.bookCopy.upsert({
          where: { barcode },
          update: {
            shelfLocation,
            branchId: branch.id
          },
          create: {
            barcode,
            bookId: book.id,
            branchId: branch.id,
            status,
            shelfLocation,
            version: 1
          }
        });
        totalCopiesCreated++;
      }
    }
  }

  console.log('\n===============================================================');
  console.log('              Catalog Import & Balance Verification            ');
  console.log('===============================================================\n');

  // Verify and print table of counts per category and subcategory
  const allBooks = await prisma.book.findMany({
    select: {
      id: true,
      category: true,
      subcategory: true,
      language: true,
      isNewArrival: true,
      isStaffPick: true
    }
  });

  const categoryCounts: Record<string, { total: number; subcategories: Record<string, number> }> = {};

  for (const b of allBooks) {
    if (!categoryCounts[b.category]) {
      categoryCounts[b.category] = { total: 0, subcategories: {} };
    }
    categoryCounts[b.category].total++;
    const subcat = b.subcategory || 'General';
    categoryCounts[b.category].subcategories[subcat] =
      (categoryCounts[b.category].subcategories[subcat] || 0) + 1;
  }

  console.log('| No. | Category Name                     | Total Books | Subcategories | Min Check (>=40) |');
  console.log('|-----|-----------------------------------|-------------|---------------|------------------|');

  let passedAll = true;
  let idx = 1;

  for (const cat of CATEGORIES) {
    const data = categoryCounts[cat.name] || { total: 0, subcategories: {} };
    const subcatCount = Object.keys(data.subcategories).length;
    const isOk = data.total >= 40;
    if (!isOk) passedAll = false;
    const checkStr = isOk ? 'PASSED (>=40)' : 'FAILED (<40)';
    console.log(
      `| ${idx.toString().padStart(2, ' ')}  | ${cat.name.padEnd(33, ' ')} | ${data.total.toString().padStart(11, ' ')} | ${subcatCount.toString().padStart(13, ' ')} | ${checkStr.padEnd(16, ' ')} |`
    );
    idx++;
  }

  const grandTotal = allBooks.length;
  const totalCopies = await prisma.bookCopy.count();

  console.log('\n---------------------------------------------------------------');
  console.log(`TOTAL BOOKS IN SYSTEM: ${grandTotal} (Target: 2,000+) -> ${grandTotal >= 2000 ? 'SUCCESS' : 'SHORT'}`);
  console.log(`TOTAL PHYSICAL COPIES: ${totalCopies}`);
  console.log(`ALL 20 CATEGORIES >= 40 BOOKS: ${passedAll ? 'CONFIRMED YES' : 'NO'}`);
  console.log('---------------------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Import pipeline failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
