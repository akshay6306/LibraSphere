import prisma from '../lib/prisma';
import cache from '../lib/cache';

export class ReportService {
  static async getOverviewStats() {
    const cached = cache.get<any>('overview_stats');
    if (cached) return cached;

    const [
      totalMembers,
      totalBooks,
      totalCopies,
      totalBranches,
      totalLoans,
      activeLoans,
      overdueLoans,
      totalFines,
      paidFines
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.book.count(),
      prisma.bookCopy.count(),
      prisma.branch.count({ where: { isActive: true } }),
      prisma.loan.count(),
      prisma.loan.count({ where: { status: 'ACTIVE' } }),
      prisma.loan.count({ where: { status: 'OVERDUE' } }),
      prisma.fine.aggregate({ _sum: { amount: true } }),
      prisma.payment.aggregate({ _sum: { amount: true } })
    ]);

    const result = {
      totalMembers,
      totalBooks,
      totalCopies,
      totalBranches,
      totalLoans,
      activeLoans,
      overdueLoans,
      totalFineAmount: totalFines._sum.amount || 0,
      totalRevenueCollected: paidFines._sum.amount || 0
    };

    cache.set('overview_stats', result, 120); // 2 min
    return result;
  }

  static async getLoansPerDay(days = 14) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const loans = await prisma.loan.findMany({
      where: {
        issuedAt: { gte: startDate }
      },
      select: {
        issuedAt: true
      }
    });

    const dayMap: Record<string, number> = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dayMap[key] = 0;
    }

    loans.forEach((l) => {
      const key = l.issuedAt.toISOString().split('T')[0];
      if (dayMap[key] !== undefined) {
        dayMap[key]++;
      }
    });

    return Object.entries(dayMap).map(([date, count]) => ({ date, count }));
  }

  static async getTopBooks(limit = 10) {
    const books = await prisma.book.findMany({
      take: limit,
      include: {
        _count: {
          select: {
            reviews: true
          }
        },
        copies: {
          select: {
            loans: { select: { id: true } }
          }
        }
      }
    });

    const formatted = books.map((b) => {
      const borrowCount = b.copies.reduce((acc, c) => acc + c.loans.length, 0);
      return {
        id: b.id,
        title: b.title,
        author: b.author,
        category: b.category,
        borrowCount
      };
    });

    return formatted.sort((a, b) => b.borrowCount - a.borrowCount).slice(0, limit);
  }

  static async getCategoryDistribution() {
    const books = await prisma.book.groupBy({
      by: ['category'],
      _count: {
        _all: true
      }
    });

    return books.map((b) => ({
      category: b.category,
      count: b._count._all
    }));
  }

  static async getBranchComparison() {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            copies: true,
            loans: true
          }
        }
      }
    });

    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      totalCopies: b._count.copies,
      totalLoans: b._count.loans
    }));
  }

  static async getFineRevenue() {
    const payments = await prisma.payment.findMany({
      orderBy: { paidAt: 'asc' },
      select: {
        amount: true,
        method: true,
        paidAt: true
      }
    });

    // Group by month
    const monthlyMap: Record<string, number> = {};
    payments.forEach((p) => {
      const monthKey = p.paidAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + p.amount;
    });

    return Object.entries(monthlyMap).map(([month, revenue]) => ({ month, revenue }));
  }

  static async getMemberGrowth() {
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const monthlyMap: Record<string, number> = {};
    members.forEach((m) => {
      const monthKey = m.createdAt.toISOString().slice(0, 7);
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
    });

    let runningTotal = 0;
    return Object.entries(monthlyMap).map(([month, count]) => {
      runningTotal += count;
      return { month, count, total: runningTotal };
    });
  }

  static async getOverdueSummary() {
    const loans = await prisma.loan.findMany({
      where: { status: 'OVERDUE' },
      include: {
        copy: { include: { book: true, branch: true } },
        member: { include: { user: true } },
        branch: true,
        fines: true
      },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();
    return loans.map((l) => {
      const diffMs = now.getTime() - l.dueDate.getTime();
      const overdueDays = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
      const fineAmount = l.fines.reduce((sum, f) => (!f.isPaid ? sum + f.amount : sum), 0);

      return {
        loanId: l.id,
        bookTitle: l.copy.book.title,
        copyBarcode: l.copy.barcode,
        branchName: l.branch.name,
        memberName: l.member.user.name,
        memberEmail: l.member.user.email,
        memberPhone: l.member.user.phone,
        membershipId: l.member.membershipId,
        dueDate: l.dueDate,
        overdueDays,
        fineAmount
      };
    });
  }
}
