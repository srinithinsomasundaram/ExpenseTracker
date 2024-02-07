import React, { useState, useEffect } from 'react';
import { getDatabase } from 'firebase/database';
import { useUserAuth } from './UserAuthContext';
import { ref, onValue, push, remove, get, set } from 'firebase/database';
import { Doughnut } from 'react-chartjs-2';
import { Chart } from 'chart.js/auto';
import Navbar from './pagecomp/Navabar';
import Sidebar from './pagecomp/Sidebar';
import HouseholdBudget from './Household';
import Profile from './Profile';
import "./Expense.css"

// Function to check if a date is today
const isToday = (expenseDate) => {
  const today = new Date();
  const expenseDay = new Date(expenseDate);
  return (
    today.getFullYear() === expenseDay.getFullYear() &&
    today.getMonth() === expenseDay.getMonth() &&
    today.getDate() === expenseDay.getDate()
  );
};

// Function to check if a date is within the current week
const isThisWeek = (expenseDate) => {
  const today = new Date();
  const expenseDay = new Date(expenseDate);
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());
  const currentWeekEnd = new Date(today);
  currentWeekEnd.setDate(today.getDate() - today.getDay() + 6);

  return expenseDay >= currentWeekStart && expenseDay <= currentWeekEnd;
};

// Function to check if a date is within the current month
const isThisMonth = (expenseDate) => {
  const today = new Date();
  const expenseDay = new Date(expenseDate);

  return (
    today.getFullYear() === expenseDay.getFullYear() &&
    today.getMonth() === expenseDay.getMonth()
  );
};

// Function to check if a date is within the current year
const isThisYear = (expenseDate) => {
  const today = new Date();
  const expenseDay = new Date(expenseDate);

  return today.getFullYear() === expenseDay.getFullYear();
};

const ExpenseTracker = () => {
  const { user } = useUserAuth();
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]); 
  const [isEditing, setIsEditing] = useState(false); // Add this line
  const [newExpense, setNewExpense] = useState({
    name: '',
    cost: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
  });
  const [newIncome, setNewIncome] = useState({
    name: '',
    amount: '',
    category: 'Salary',
    date: new Date().toISOString().split('T')[0],
  });
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  
  useEffect(() => {
    if (user) {
      const db = getDatabase();
      const incomesRef = ref(db, `users/${user.uid}/incomes`);
      const unsubscribeIncomes = onValue(incomesRef, (snapshot) => {
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

      return () => {
        unsubscribeIncomes();
      };
    }
  }, [user]);
  
  
  const addIncome = async () => {
    // Convert the amount to a float and check if it's a valid number
    const amount = parseFloat(newIncome.amount);
  
    if (!isNaN(amount) && isFinite(amount)) {
      if (newIncome.name.trim() !== '' && amount >= 0 && user) {
        const db = getDatabase();
        const incomesRef = ref(db, `users/${user.uid}/incomes`);
        
        await push(incomesRef, {
          name: newIncome.name,
          amount: amount, // Use the validated amount
          category: newIncome.category,
          date: newIncome.date,
          timestamp: new Date().toISOString(),
        });
  
        setNewIncome({
          name: '',
          amount: '',
          category: 'Salary',
          date: new Date().toISOString().split('T')[0],
        });
      }
    } else {
      // Handle the case where 'amount' is not a valid number
      console.error("Invalid amount:", newIncome.amount);
      // Optionally, provide feedback to the user about the invalid input
      // For example: alert("Please enter a valid amount.");
    }
  };
  

  const editIncome = async (incomeId) => {
    setEditingIncomeId(incomeId);
    const incomeToEdit = incomes.find((income) => income.id === incomeId);
    setNewIncome({
      name: incomeToEdit.data.name,
      amount: String(incomeToEdit.data.amount),
      category: incomeToEdit.data.category,
      date: incomeToEdit.data.date,
    });
  };

  const deleteIncome = async (incomeId) => {
    if (user) {
      const db = getDatabase();
      const incomeRef = ref(db, `users/${user.uid}/incomes/${incomeId}`);
      await remove(incomeRef);
    }
  };
 
  const [categories, setCategories] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const currentDate = new Date(); // Get the current date and time

// Calculate the start of the current week
const startOfWeek = new Date(currentDate);
startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Set to the first day (Sunday) of the week
startOfWeek.setHours(0, 0, 0, 0); // Set to midnight

// Calculate the end of the current week
const endOfWeek = new Date(currentDate);
endOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 6); // Set to the last day (Saturday) of the week
endOfWeek.setHours(23, 59, 59, 999); // Set to the last millisecond of the day

  useEffect(() => {
    const fetchCategories = async () => {
      if (user) {
        const db = getDatabase();
        const categoriesRef = ref(db, `users/${user.uid}/categories`);

        onValue(categoriesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setCategories(Object.keys(data));
          } else {
            setCategories([]);
          }
        });
      }
    };

    fetchCategories();
  }, [user]);

  const cancelEdit = () => {
    setEditingExpenseId(null);
    setNewExpense({
      name: '',
      cost: '',
      category: 'Other',
      date: new Date().toISOString().split('T')[0],
    });
  };

  useEffect(() => {
    if (user) {
      const db = getDatabase();
      const expensesRef = ref(db, `users/${user.uid}/expenses`);
      const unsubscribeExpenses = onValue(expensesRef, (snapshot) => {
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

      return () => {
        unsubscribeExpenses();
      };
    }
  }, [user]);

  const addExpense = async () => {
    if (newExpense.name.trim() !== '' && newExpense.cost.trim() !== '' && user) {
      const db = getDatabase();
      const expensesRef = ref(db, `users/${user.uid}/expenses`);
      await push(expensesRef, {
        name: newExpense.name,
        cost: parseFloat(newExpense.cost),
        category: newExpense.category,
        date: newExpense.date,
        timestamp: new Date().toISOString(),
      });
      setNewExpense({
        name: '',
        cost: '',
        category: 'add new category',
        date: new Date().toISOString().split('T')[0],
      });
    }
  };

  const editExpense = async (expenseId) => {
    setEditingExpenseId(expenseId);
    const expenseToEdit = expenses.find((expense) => expense.id === expenseId);
    setNewExpense({
      name: expenseToEdit.data.name,
      cost: String(expenseToEdit.data.cost),
      category: expenseToEdit.data.category,
      date: expenseToEdit.data.date,
    });
  };

  const deleteExpense = async (expenseId) => {
    if (user) {
      const db = getDatabase();
      const expenseRef = ref(db, `users/${user.uid}/expenses/${expenseId}`);
      await remove(expenseRef);
    }
  };

  const addNewCategory = async (newCategory) => {
    if (user && newCategory.trim() !== '') {
      const db = getDatabase();
      const categoriesRef = ref(db, `users/${user.uid}/categories`);

      const snapshot = await get(categoriesRef);
      const existingCategories = snapshot.val() || {};

      if (!existingCategories[newCategory]) {
        await push(categoriesRef, newCategory);
        setCategories([...categories, newCategory]);
      }
    }
  };


  const updateExpense = async () => {
    if (newExpense.name.trim() !== '' && newExpense.cost.trim() !== '' && user) {
      const db = getDatabase();
      const expenseRef = ref(db, `users/${user.uid}/expenses/${editingExpenseId}`);
      
      await set(expenseRef, {
        name: newExpense.name,
        cost: parseFloat(newExpense.cost),
        category: newExpense.category,
        date: newExpense.date,
        timestamp: new Date().toISOString(),
      });

      const updatedCategoriesRef = ref(db, `users/${user.uid}/categories`);
      onValue(updatedCategoriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setCategories(Object.keys(data));
        } else {
          setCategories([]);
        }
      });

      setEditingExpenseId(null);
      setNewExpense({
        name: '',
        cost: '',
        category: 'Other',
        date: new Date().toISOString().split('T')[0],
      });
    }
  };
  


  const calculateTotal = () => {
    const currentDate = new Date();
  
    let filteredExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.data.date);
  
      switch (filterType) {
        case 'today':
          return (
            expenseDate.getFullYear() === currentDate.getFullYear() &&
            expenseDate.getMonth() === currentDate.getMonth() &&
            expenseDate.getDate() === currentDate.getDate()
          );
        case 'thisWeek':
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
  
          const endOfWeek = new Date(currentDate);
          endOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
  
          return expenseDate >= startOfWeek && expenseDate <= endOfWeek;
  
        case 'thisMonth':
          return (
            expenseDate.getFullYear() === currentDate.getFullYear() &&
            expenseDate.getMonth() === currentDate.getMonth()
          );
        case 'thisYear':
          return expenseDate.getFullYear() === currentDate.getFullYear();
        default:
          return true;
      }
    });
    const generateChartData = (categoryExpenses) => {
      const labels = Object.keys(categoryExpenses);
      const data = Object.values(categoryExpenses);
    
      return {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8e5ea2', '#3cba9f', '#e8c3b9', '#c45850'],
            hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8e5ea2', '#3cba9f', '#e8c3b9', '#c45850'],
          },
        ],
      };
    };
    
    // Add category filtering
    if (categoryFilter !== 'all') {
      filteredExpenses = filteredExpenses.filter(
        (expense) => expense.data.category === categoryFilter
      );
    }

  
 
  
    return filteredExpenses.reduce((total, expense) => total + parseFloat(expense.data.cost), 0);
  };
  const filteredExpenses = expenses.filter((expense) => {
    const currentDate = new Date(); // Define currentDate here to avoid the 'no-undef' error
    const expenseDate = new Date(expense.data.date);
  
    switch (filterType) {
      case 'today':
        return (
          expenseDate.getFullYear() === currentDate.getFullYear() &&
          expenseDate.getMonth() === currentDate.getMonth() &&
          expenseDate.getDate() === currentDate.getDate()
        );
      case 'thisWeek':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
  
        const endOfWeek = new Date(currentDate);
        endOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
  
        return expenseDate >= startOfWeek && expenseDate <= endOfWeek;
  
      case 'thisMonth':
        return (
          expenseDate.getFullYear() === currentDate.getFullYear() &&
          expenseDate.getMonth() === currentDate.getMonth()
        );
      case 'thisYear':
        return expenseDate.getFullYear() === currentDate.getFullYear();
  
      default:
        return true;
    }
    if (categoryFilter !== 'all' && expense.data.category !== categoryFilter) {
      return false;
    }
  
    return true;

  });
  
  
  
  
  const calculateCategoryExpenses = () => {
    const categoryExpenses = {};

    filteredExpenses.forEach((expense) => {
      const category = expense.data.category;
      const cost = parseFloat(expense.data.cost);

      if (categoryExpenses[category]) {
        categoryExpenses[category] += cost;
      } else {
        categoryExpenses[category] = cost;
      }
    });

    return categoryExpenses;
  };


  const categoryExpenses = calculateCategoryExpenses();
  
  
  const addOrUpdateIncome = async () => {
    const amount = parseFloat(newIncome.amount);

    if (!isNaN(amount) && isFinite(amount) && newIncome.name.trim() !== '' && amount >= 0 && user) {
      const db = getDatabase();
      const incomesRef = ref(db, `users/${user.uid}/incomes`);

      if (isEditing) {
        // If editing, update the existing income
        const incomeRef = ref(db, `users/${user.uid}/incomes/${newIncome.id}`);
        await set(incomeRef, {
          name: newIncome.name,
          amount: amount,
          category: newIncome.category,
          date: newIncome.date,
          timestamp: new Date().toISOString(),
        });
        setIsEditing(false); // Exit edit mode after updating
      } else {
        // If not editing, add a new income
        await push(incomesRef, {
          name: newIncome.name,
          amount: amount,
          category: newIncome.category,
          date: newIncome.date,
          timestamp: new Date().toISOString(),
        });
      }

      // Reset the newIncome state
      setNewIncome({
        name: '',
        amount: '',
        category: 'Salary',
        date: new Date().toISOString().split('T')[0],
        id: '',
      });
    } else {
      console.error("Invalid income data:", newIncome);
    }
  };

  // Function to handle the edit button click
  const handleEditClick = (income) => {
    setIsEditing(true);
    setNewIncome({
      id: income.id,
      name: income.data.name,
      amount: income.data.amount,
      category: income.data.category,
      date: income.data.date,
    });
  };


  return (
    
    <div>
   
     
       <HouseholdBudget />
       <div className="income-form">
  <h3>{isEditing ? 'Edit Income' : 'Add Income'}</h3>
  <label className="form-label">Name:</label>
  <input
    type="text"
    value={newIncome.name}
    onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
    className="form-input"
  />
  <label className="form-label">Amount:</label>
  <input
    type="number"
    value={newIncome.amount}
    onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
    className="form-input"
  />
  <label className="form-label">Category:</label>
  <input
    type="text"
    value={newIncome.category}
    onChange={(e) => setNewIncome({ ...newIncome, category: e.target.value })}
    className="form-input"
  />
  <label className="form-label">Date:</label>
  <input
    type="date"
    value={newIncome.date}
    onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
    className="form-input"
  />
  <button onClick={addOrUpdateIncome} className="form-button">
    {isEditing ? 'Update Income' : 'Add Income'}
  </button>
</div>


{/* Display income data */}
<h3>Total Income</h3>
<p>{/* Display total income */}</p>
<ul className="income-list">
  {incomes.map((income) => (
    <li key={income.id} className="income-item">
      {/* Display income details */}
      <strong>Expense:</strong> {income.data.name},&nbsp;
      <strong>Amount:</strong> {income.data.amount},&nbsp;
      <strong>Category:</strong> {income.data.category},&nbsp;
      <strong>Date:</strong> {income.data.date}
      <button onClick={() => deleteIncome(income.id)} className="delete-button">Delete</button>
      <button onClick={() => editIncome(income.id)} className="edit-button">Edit</button>
    </li>
  ))}
</ul>


      <h2>Expense Tracker</h2>
      <div>
        <label>Expense Name:</label>
        <input
          type="text"
          value={newExpense.name}
          onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
        />
      </div>
      <div>
        <label>Cost:</label>
        <input
          type="text"
          value={newExpense.cost}
          onChange={(e) => setNewExpense({ ...newExpense, cost: e.target.value })}
        />
      </div>
      <div>
        <label>Category:</label>
        <select
          value={newExpense.category}
          onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
          <option value="Food">Food</option>
          <option value="Entertainment">Entertainment</option>
          <option value="grocerys">grocerys</option>
          <option value="Dress">Dress</option>
          <option value="Fuel">Fuel</option>
          <option value="Medicine">Medicine</option>
          <option value="Appearals">Appearals</option>
          <option value="Rent">Rent</option>
          <option value="Transportation">Transportation</option>
          <option value="Other">other</option>

          
        </select>
        {newExpense.category === 'other' && (
          <div>
            <input
              type="text"
              placeholder="Enter new category"
              value={newExpense.newCategory || ''}
              onChange={(e) => setNewExpense({ ...newExpense, newCategory: e.target.value })}
            />
            <button onClick={() => addNewCategory(newExpense.newCategory)}>
              Add Category
            </button>
          </div>
        )}
      </div>
      

      <div>
        <label>Date:</label>
        <input
          type="date"
          value={newExpense.date}
          onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
        />
      </div>
      
      <button onClick={editingExpenseId ? updateExpense : addExpense}>
        {editingExpenseId ? 'Update Expense' : 'Add Expense'}
      </button>
      {editingExpenseId && (
        <button onClick={cancelEdit} style={{ marginLeft: '10px' }}>
          Cancel Edit
        </button>
      )}
            <div>
        <label>Date Filter:</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="thisWeek">This Week</option>
          <option value="thisMonth">This Month</option>
          <option value="thisYear">This Year</option>
        </select>
      </div>
      <div>
      <label>Category Filter:</label>
<select
  value={categoryFilter}
  onChange={(e) => setCategoryFilter(e.target.value)}
>
  <option value="all">All Categories</option>
  {categories.map((category) => (
    <option key={category} value={category}>
      {category}
    </option>
  ))}
  {/* Static options */}
  <option value="Food">Food</option>
  <option value="Entertainment">Entertainment</option>
  <option value="grocerys">Groceries</option>
  <option value="Shopping">Shopping</option>
  <option value="Fuel">Fuel</option>
  <option value="Medicine">Medicine</option>
  <option value="Rent">Rent</option>
  <option value="Transportation">Transportation</option>
  <option value="Other">Other</option>
</select>
</div>
      
      <div>
        <h3>Total Expenses</h3>
        <p>{filterType !== 'all' ? `${filterType.charAt(0).toUpperCase()}${filterType.slice(1)}:` : 'All Time:'} Rs:{calculateTotal().toFixed(2)}</p>
      </div>
      <ul>
      {filteredExpenses.map((expense) => (
        <li key={expense.id}>
          {/* Display expense details only if it matches the category and date filters */}
          {((filterType === 'all') ||
            (filterType === 'today' && isToday(expense.data.date)) ||
            (filterType === 'thisWeek' && isThisWeek(expense.data.date)) ||
            (filterType === 'thisMonth' && isThisMonth(expense.data.date)) ||
            (filterType === 'thisYear' && isThisYear(expense.data.date))) &&
            ((categoryFilter === 'all') || (categoryFilter === expense.data.category)) && (
            <>
              <strong>Expense Name:</strong> {expense.data.name},&nbsp;
              <strong>Cost:</strong> {expense.data.cost},&nbsp;
              <strong>Category:</strong> {expense.data.category},&nbsp;
              <strong>Date:</strong> {expense.data.date}
              <button onClick={() => deleteExpense(expense.id)}>Delete</button>
              <button onClick={() => editExpense(expense.id)}>Edit</button>
            </>
          )}
        </li>
      ))}
   
    </ul>


    </div>  
    
  );
};

export default ExpenseTracker;
