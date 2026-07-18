import { useState } from 'react';

function App() {
  const [formData, setFormData] = useState({
    email: '',
    telegramChatId: '', // <-- Added new state field
    fitnessGoal: '',
    equipment: '',
    dietaryRestrictions: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    
    try {
      const response = await fetch('https://ai-fitness-planner-amim.onrender.com/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus('Success! Your AI Agent is now active on Telegram.');
        // Clear out the new field on success
        setFormData({ email: '', telegramChatId: '', fitnessGoal: '', equipment: '', dietaryRestrictions: '' });
      } else {
        setStatus('Error activating agent. Please try again.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setStatus('Network error. Is your backend running?');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          AI Fitness Planner
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign up to receive daily personalized workout and meal plans directly to your phone.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            {/* --- NEW TELEGRAM CHAT ID FIELD --- */}
            <div>
              <label htmlFor="telegramChatId" className="block text-sm font-medium text-gray-700">Telegram Chat ID</label>
              <div className="mt-1">
                <input id="telegramChatId" name="telegramChatId" type="text" placeholder="e.g., 123456789" required value={formData.telegramChatId} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                <strong>Step 1:</strong> Start a chat with <a href="https://t.me/ai_fitness_planner_bot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">@ai_fitness_planner_bot</a> so it has permission to message you.<br/>
                <strong>Step 2:</strong> To find your ID, search for <strong>@userinfobot</strong> on Telegram and send it a message. It will instantly reply with your numeric ID to paste here.
              </p>
            </div>

            <div>
              <label htmlFor="fitnessGoal" className="block text-sm font-medium text-gray-700">Fitness Goal</label>
              <div className="mt-1">
                <input id="fitnessGoal" name="fitnessGoal" type="text" placeholder="e.g., Build muscle, lose weight" required value={formData.fitnessGoal} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="equipment" className="block text-sm font-medium text-gray-700">Available Equipment</label>
              <div className="mt-1">
                <input id="equipment" name="equipment" type="text" placeholder="e.g., Dumbbells, gym access, bodyweight only" required value={formData.equipment} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="dietaryRestrictions" className="block text-sm font-medium text-gray-700">Dietary Restrictions</label>
              <div className="mt-1">
                <input id="dietaryRestrictions" name="dietaryRestrictions" type="text" placeholder="e.g., Vegan, keto, none" required value={formData.dietaryRestrictions} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Activate My AI Agent
              </button>
            </div>
          </form>

          {status && (
            <div className={`mt-4 text-center text-sm font-medium ${status.includes('Error') || status.includes('network') ? 'text-red-600' : 'text-green-600'}`}>
              {status}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;