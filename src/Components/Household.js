import React, { useState, useEffect } from 'react';
import { getDatabase } from 'firebase/database';
import { ref, onValue, push, remove, set } from 'firebase/database';

import { useUserAuth } from './UserAuthContext';
import Home from './Home';
import './House.css';


const HouseholdBudget = () => {
  const { user } = useUserAuth();
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [remainingBudget, setRemainingBudget] = useState(0);

  const [newIncome, setNewIncome] = useState({
    name: '',
    amount: '',
    category: 'Salary',
    date: new Date().toISOString().split('T')[0],
  });
  const [newExpense, setNewExpense] = useState({
    name: '',
    cost: '',
    category: 'Groceries',
    date: new Date().toISOString().split('T')[0],
  });
  const [newMonthlyBudget, setNewMonthlyBudget] = useState('');
  const [spendingGoal, setSpendingGoal] = useState(0);
  const [alertMessage, setAlertMessage] = useState('');

  // Function to set the monthly budget
  const setBudget = async () => {
    const budget = parseFloat(newMonthlyBudget);

    if (!isNaN(budget) && isFinite(budget) && budget >= 0 && user) {
      const db = getDatabase();
      const budgetRef = ref(db, `users/${user.uid}/budget`);

      await set(budgetRef, {
        monthlyBudget: budget,
      });

      setMonthlyBudget(budget);
      setNewMonthlyBudget('');

      // Set the spending goal as a percentage of the monthly budget (e.g., 80%)
      const goalPercentage = 80;
      const calculatedSpendingGoal = (budget * goalPercentage) / 100;
      setSpendingGoal(calculatedSpendingGoal);
    } else {
      console.error("Invalid monthly budget data:", newMonthlyBudget);
    }
  };

  // Function to delete an expense
  const deleteExpense = async (expenseId) => {
    if (user) {
      const db = getDatabase();
      const expenseRef = ref(db, `users/${user.uid}/expenses/${expenseId}`);
      await remove(expenseRef);
    }
  };

  // Function to delete an income
  const deleteIncome = async (incomeId) => {
    if (user) {
      const db = getDatabase();
      const incomeRef = ref(db, `users/${user.uid}/incomes/${incomeId}`);
      await remove(incomeRef);
    }
  };

  // Function to calculate remaining budget and check spending goal
  const calculateRemainingBudget = () => {
    const totalIncome = incomes.reduce((total, income) => total + parseFloat(income.data.amount), 0);
    const totalExpense = expenses.reduce((total, expense) => total + parseFloat(expense.data.cost), 0);
    const remaining = totalIncome - totalExpense;
    setRemainingBudget(remaining);

    // Check if total expenses exceed the spending goal
    if (totalExpense > spendingGoal) {
      setAlertMessage('Alert: Total expenses have exceeded the spending goal!');
    }

    // Clear alert after 3 seconds
    setTimeout(() => setAlertMessage(''), 5000);
  };

  useEffect(() => {
    const fetchMonthlyBudget = async () => {
      if (user) {
        const db = getDatabase();
        const budgetRef = ref(db, `users/${user.uid}/budget`);

        onValue(budgetRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setMonthlyBudget(data.monthlyBudget || 0);

            const goalPercentage = 80;
            const calculatedSpendingGoal = (data.monthlyBudget * goalPercentage) / 100;
            setSpendingGoal(calculatedSpendingGoal);
          } else {
            setMonthlyBudget(0);
            setSpendingGoal(0);
          }
        });
      }
    };

    const fetchIncomes = async () => {
      if (user) {
        const db = getDatabase();
        const incomesRef = ref(db, `users/${user.uid}/incomes`);

        onValue(incomesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const sortedIncomes = Object.entries(data)
              .map(([id, income]) => ({ id, data: income }))
              .sort((a, b) => new Date(b.data.timestamp) - new Date(a.data.timestamp));
            setIncomes(sortedIncomes);
          } else {
            setIncomes([]);
          }
        });
      }
    };

    const fetchExpenses = async () => {
      if (user) {
        const db = getDatabase();
        const expensesRef = ref(db, `users/${user.uid}/expenses`);

        onValue(expensesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const sortedExpenses = Object.entries(data)
              .map(([id, expense]) => ({ id, data: expense }))
              .sort((a, b) => new Date(b.data.timestamp) - new Date(a.data.timestamp));
            setExpenses(sortedExpenses);
          } else {
            setExpenses([]);
          }
        });
      }
    };

    fetchMonthlyBudget();
    fetchIncomes();
    fetchExpenses();
  }, [user]);

  // Update remaining budget and check spending goal when incomes or expenses change
  useEffect(() => {
    calculateRemainingBudget();
  }, [incomes, expenses]);

  // Function to add an income
  const addIncome = async () => {
    const amount = parseFloat(newIncome.amount);

    if (!isNaN(amount) && isFinite(amount) && newIncome.name.trim() !== '' && amount >= 0 && user) {
      const db = getDatabase();
      const incomesRef = ref(db, `users/${user.uid}/incomes`);

      // If there is an existing income with the same ID, update it
      const existingIncome = incomes.find(income => income.data.id === newIncome.id);
      if (existingIncome) {
        const incomeRef = ref(db, `users/${user.uid}/incomes/${existingIncome.id}`);
        await set(incomeRef, {
          name: newIncome.name,
          amount: amount,
          category: newIncome.category,
          date: newIncome.date,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Otherwise, add a new income
        await push(incomesRef, {
          name: newIncome.name,
          amount: amount,
          category: newIncome.category,
          date: newIncome.date,
          timestamp: new Date().toISOString(),
        });
      }

      setNewIncome({
        name: '',
        amount: '',
        category: 'Salary',
        date: new Date().toISOString().split('T')[0],
        id: '', // Reset the ID after adding/editing
      });
    } else {
      console.error("Invalid income data:", newIncome);
    }
  };


  // Function to add an expense
  const addExpense = async () => {
    const cost = parseFloat(newExpense.cost);

    if (!isNaN(cost) && isFinite(cost) && newExpense.name.trim() !== '' && cost >= 0 && user) {
      const db = getDatabase();
      const expensesRef = ref(db, `users/${user.uid}/expenses`);

      await push(expensesRef, {
        name: newExpense.name,
        cost: cost,
        category: newExpense.category,
        date: newExpense.date,
        timestamp: new Date().toISOString(),
      });

      setNewExpense({
        name: '',
        cost: '',
        category: 'Groceries',
        date: new Date().toISOString().split('T')[0],
      });
    } else {
      console.error("Invalid expense data:", newExpense);
    }
  };

  return (
    <div className="container animation">
  <Home />

  <div>
    <div className="input-container animation">
      <label htmlFor="monthlyBudget">Monthly Budget:</label>
      <input
        type="number"
        id="monthlyBudget"
        value={newMonthlyBudget}
        onChange={(e) => setNewMonthlyBudget(e.target.value)}
        className="input"
      />
      <button onClick={setBudget} className="button">Set Budget</button>
      {alertMessage && <div className="alert animation">{alertMessage}</div>}
    </div>

    <div className="analysis">
      <div className="analysis-card animation">
        <h3 className="card-title">Monthly Budget</h3>
        <p className="card-value">Rs: {monthlyBudget}</p>
      </div>
      <div className="analysis-card animation">
        <h3 className="card-title">Total Incomes</h3>
        <p className="card-value">Rs: {incomes.reduce((total, income) => total + parseFloat(income.data.amount), 0)}</p>
      </div>
      <div className="analysis-card animation">
        <h3 className="card-title">Total Expenses</h3>
        <p className="card-value">Rs: {expenses.reduce((total, expense) => total + parseFloat(expense.data.cost), 0)}</p>
      </div>
      <div className="analysis-card animation">
        <h3 className="card-title">Remaining Budget</h3>
        <p className="card-value">Rs: {remainingBudget}</p>
      </div>
    </div>
  </div>
</div>

  );
};

export default HouseholdBudget;
