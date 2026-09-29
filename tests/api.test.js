process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { hashPassword, comparePassword } = require('../src/utils/password');

test('=== Teenager Expense Tracker Test Suite ===', async (t) => {
  let userAToken = '';
  let userBToken = '';
  let userAId = '';
  let userBId = '';
  let userAExpenseId = '';
  let categoryId = '11111111-1111-1111-1111-111111111101'; // Food & Snacks

  // 1. Password Hashing and Comparison
  await t.test('Password Hashing: bcrypt generates hash and correctly verifies password', async () => {
    const plain = 'SecretPassword123';
    const hash = await hashPassword(plain);
    assert.notEqual(plain, hash);
    assert.ok(hash.startsWith('$2'));

    const isMatch = await comparePassword(plain, hash);
    assert.equal(isMatch, true);

    const isWrong = await comparePassword('WrongPassword', hash);
    assert.equal(isWrong, false);
  });

  // 2. User Registration (User A)
  await t.test('Auth: Register new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alex Johnson',
        email: 'alex@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        monthly_allowance: 3000,
        currency: 'INR'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'alex@example.com');
    assert.equal(res.body.data.user.password_hash, undefined, 'Password hash must never be returned');

    userAToken = res.body.data.token;
    userAId = res.body.data.user.id;
  });

  // 3. Duplicate Email Prevention
  await t.test('Auth: Reject duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alex Duplicate',
        email: 'alex@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  // 4. Register Second User (User B) for Security & Isolation Tests
  await t.test('Auth: Register User B', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sam Smith',
        email: 'sam@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        monthly_allowance: 4000,
        currency: 'INR'
      });

    assert.equal(res.status, 201);
    userBToken = res.body.data.token;
    userBId = res.body.data.user.id;
  });

  // 5. User Login
  await t.test('Auth: Login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex@example.com',
        password: 'Password123!'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'alex@example.com');
  });

  // 6. Invalid Login Handling
  await t.test('Auth: Reject invalid login password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alex@example.com',
        password: 'WrongPassword'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 7. Protected Route Without Token
  await t.test('Security: Unauthenticated request to protected route is rejected', async () => {
    const res = await request(app).get('/api/expenses');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  // 8. Protected Route With Invalid Token
  await t.test('Security: Request with forged/invalid token is rejected', async () => {
    const res = await request(app)
      .get('/api/expenses')
      .set('Authorization', 'Bearer invalid.token.payload');
    assert.equal(res.status, 401);
  });

  // 9. Input Validation on Expense Creation
  await t.test('Validation: Rejects negative or missing expense amounts', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        amount: -50,
        description: 'Invalid',
        categoryId
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  // 10. Create Expense as User A
  await t.test('Expense CRUD: User A creates an expense', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        amount: 250.00,
        description: 'School Canteen Lunch',
        categoryId,
        expenseDate: '2026-09-28',
        paymentMethod: 'Cash',
        notes: 'Delicious burger and juice'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.expense.amount, 250.00);
    userAExpenseId = res.body.data.expense.id;
  });

  // 11. Read Expense as User A
  await t.test('Expense CRUD: User A can read own expense', async () => {
    const res = await request(app)
      .get(`/api/expenses/${userAExpenseId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.expense.id, userAExpenseId);
  });

  // 12. Security: User B CANNOT read User A's expense
  await t.test('Security: User B CANNOT read User A\'s expense (404/unauthorized)', async () => {
    const res = await request(app)
      .get(`/api/expenses/${userAExpenseId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    assert.equal(res.status, 404);
  });

  // 13. Security: User B CANNOT modify User A's expense
  await t.test('Security: User B CANNOT modify User A\'s expense', async () => {
    const res = await request(app)
      .put(`/api/expenses/${userAExpenseId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        amount: 999.00
      });

    assert.equal(res.status, 404);
  });

  // 14. Update Expense as User A
  await t.test('Expense CRUD: User A can update own expense', async () => {
    const res = await request(app)
      .put(`/api/expenses/${userAExpenseId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        description: 'School Canteen Lunch Special',
        amount: 275.50
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.expense.amount, 275.50);
  });

  // 15. Budgets: Create and calculate budget progress
  await t.test('Budgets: Create budget and verify real-time spending calculations', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'September Food Budget',
        amount: 1000,
        period: 'monthly',
        categoryId,
        startDate: '2026-09-01',
        endDate: '2026-09-30'
      });

    assert.equal(res.status, 201);
    const budgetId = res.body.data.budget.id;

    // Fetch budget list to verify spent amount
    const listRes = await request(app)
      .get('/api/budgets')
      .set('Authorization', `Bearer ${userAToken}`);

    assert.equal(listRes.status, 200);
    const myBudget = listRes.body.data.budgets.find(b => b.id === budgetId);
    assert.ok(myBudget);
    assert.equal(myBudget.spent, 275.50);
    assert.equal(myBudget.remaining, 724.50);
    assert.ok(myBudget.utilization > 0);
  });

  // 16. Savings Goals: Create, deposit and progress calculation
  await t.test('Savings: Create savings goal and deposit money', async () => {
    const res = await request(app)
      .post('/api/savings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'New Headphones',
        targetAmount: 3000,
        currentAmount: 1000
      });

    assert.equal(res.status, 201);
    const goalId = res.body.data.goal.id;

    // Deposit 500
    const depositRes = await request(app)
      .post(`/api/savings/${goalId}/deposit`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ amount: 500 });

    assert.equal(depositRes.status, 200);
    assert.equal(depositRes.body.data.goal.current_amount, 1500);

    // Verify progress is 50%
    const listRes = await request(app)
      .get('/api/savings')
      .set('Authorization', `Bearer ${userAToken}`);

    const myGoal = listRes.body.data.goals.find(g => g.id === goalId);
    assert.equal(myGoal.progress, 50);
  });

  // 17. Analytics: Summary endpoint calculations
  await t.test('Analytics: Summary returns real user data', async () => {
    const res = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${userAToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.monthlyAllowance, 3000);
    assert.equal(res.body.data.totalSpent, 275.50);
    assert.equal(res.body.data.totalSaved, 1500);
    assert.equal(res.body.data.remainingMoney, 2724.50);
  });

  // 18. Insight Engine: Generates real rule-based insights
  await t.test('Insights: Generates actionable advice based on spending patterns', async () => {
    const res = await request(app)
      .get('/api/insights')
      .set('Authorization', `Bearer ${userAToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.insights));
    assert.ok(res.body.data.insights.length > 0);
  });

  // 19. Security: User B CANNOT delete User A's expense
  await t.test('Security: User B CANNOT delete User A\'s expense', async () => {
    const res = await request(app)
      .delete(`/api/expenses/${userAExpenseId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    assert.equal(res.status, 404);
  });

  // 20. Expense CRUD: User A can delete own expense
  await t.test('Expense CRUD: User A can delete own expense', async () => {
    const res = await request(app)
      .delete(`/api/expenses/${userAExpenseId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.equal(res.status, 200);
  });
});
