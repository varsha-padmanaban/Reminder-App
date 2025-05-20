// DOM Elements
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        const messageInput = document.getElementById('messageInput');
        const emailInput = document.getElementById('emailInput');
        const dateInput = document.getElementById('dateInput');
        const timeInput = document.getElementById('timeInput');
        const setReminderBtn = document.getElementById('setReminder');
        const remindersList = document.getElementById('remindersList');
        const selectAllReminders = document.getElementById('selectAllReminders');
        const deleteSelectedReminders = document.getElementById('deleteSelectedReminders');
        const notification = document.getElementById('notification');

        // State
        let reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        let selectedReminders = new Set();

        // Tab functionality
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const tabId = `${tab.dataset.tab}-tab`;
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Set Reminder
        setReminderBtn.addEventListener('click', () => {
            const message = messageInput.value.trim();
            const email = emailInput.value.trim();
            const date = dateInput.value;
            const time = timeInput.value;
            
            if (!message || !email || !date || !time) {
                showNotification('Please fill in all fields');
                return;
            }
            
            if (!validateEmail(email)) {
                showNotification('Please enter a valid email address');
                return;
            }
            
            const reminderDate = new Date(`${date}T${time}`);
            if (reminderDate <= new Date()) {
                showNotification('Please select a future date and time');
                return;
            }
            
            const reminder = {
                id: Date.now(),
                message,
                email,
                date,
                time,
                status: 'pending'
            };
            
            reminders.unshift(reminder);
            localStorage.setItem('reminders', JSON.stringify(reminders));
            renderReminders();
            
            // Schedule the reminder
            scheduleReminder(reminder);
            
            // Clear inputs
            messageInput.value = '';
            emailInput.value = '';
            dateInput.value = '';
            timeInput.value = '';
            
            showNotification('Reminder set successfully');
            
            // Switch to view tab
            tabs[1].click();
        });

        // Select All Reminders
        selectAllReminders.addEventListener('change', () => {
            if (selectAllReminders.checked) {
                reminders.forEach(reminder => selectedReminders.add(reminder.id));
            } else {
                selectedReminders.clear();
            }
            renderReminders();
        });

        // Delete Selected Reminders
        deleteSelectedReminders.addEventListener('click', () => {
            if (selectedReminders.size === 0) return;
            
            if (confirm('Are you sure you want to delete the selected reminders?')) {
                reminders = reminders.filter(reminder => !selectedReminders.has(reminder.id));
                localStorage.setItem('reminders', JSON.stringify(reminders));
                selectedReminders.clear();
                renderReminders();
                showNotification('Selected reminders deleted');
            }
        });

        // Render Reminders
        function renderReminders() {
            remindersList.innerHTML = '';
            
            if (reminders.length === 0) {
                remindersList.innerHTML = '<p style="text-align: center; padding: 20px;">No reminders yet</p>';
                deleteSelectedReminders.style.display = 'none';
                return;
            }
            
            reminders.forEach(reminder => {
                const reminderElement = document.createElement('div');
                reminderElement.className = 'reminder-item';
                
                const formattedDate = new Date(`${reminder.date}T${reminder.time}`).toLocaleString();
                
                reminderElement.innerHTML = `
                    <input type="checkbox" class="reminder-checkbox" data-id="${reminder.id}" 
                        ${selectedReminders.has(reminder.id) ? 'checked' : ''}>
                    <div class="reminder-content">${reminder.message}</div>
                    <div class="reminder-details">
                        <strong>Email:</strong> ${reminder.email}<br>
                        <strong>Scheduled for:</strong> ${formattedDate}<br>
                        <strong>Status:</strong> <span class="${reminder.status === 'sent' ? 'status-sent' : (reminder.status === 'failed' ? 'status-failed' : '')}">${reminder.status}</span>
                    </div>
                    <button class="delete-btn" data-id="${reminder.id}">×</button>
                `;
                
                const checkbox = reminderElement.querySelector('.reminder-checkbox');
                checkbox.addEventListener('change', (e) => {
                    const id = parseInt(e.target.dataset.id);
                    if (e.target.checked) {
                        selectedReminders.add(id);
                    } else {
                        selectedReminders.delete(id);
                        selectAllReminders.checked = false;
                    }
                    updateDeleteSelectedRemindersButton();
                });
                
                const deleteBtn = reminderElement.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this reminder?')) {
                        reminders = reminders.filter(r => r.id !== parseInt(deleteBtn.dataset.id));
                        localStorage.setItem('reminders', JSON.stringify(reminders));
                        renderReminders();
                        showNotification('Reminder deleted');
                    }
                });
                
                remindersList.appendChild(reminderElement);
            });
            
            updateDeleteSelectedRemindersButton();
        }

        // Update Delete Selected Reminders Button
        function updateDeleteSelectedRemindersButton() {
            deleteSelectedReminders.style.display = selectedReminders.size > 0 ? 'inline-block' : 'none';
            selectAllReminders.checked = selectedReminders.size === reminders.length && reminders.length > 0;
        }

        // Send Email Notification
        async function sendEmailNotification(reminder) {
            try {
                // In a real application, you would use a server-side API or service
                // This is a simulation for demonstration purposes
                console.log(`Sending email notification to ${reminder.email} with message: ${reminder.message}`);
                
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Show success message
                showNotification(`Email notification sent to ${reminder.email}`);
                return true;
            } catch (error) {
                console.error('Error sending notification:', error);
                showNotification('Failed to send email notification');
                return false;
            }
        }

        // Schedule Reminder
        function scheduleReminder(reminder) {
            const reminderTime = new Date(`${reminder.date}T${reminder.time}`).getTime();
            const currentTime = new Date().getTime();
            const timeUntilReminder = reminderTime - currentTime;
            
            if (timeUntilReminder <= 0) return;
            
            setTimeout(async () => {
                // Send email notification
                const notificationSent = await sendEmailNotification(reminder);
                
                // Update reminder status
                const index = reminders.findIndex(r => r.id === reminder.id);
                if (index !== -1) {
                    reminders[index].status = notificationSent ? 'sent' : 'failed';
                    localStorage.setItem('reminders', JSON.stringify(reminders));
                    renderReminders();
                    
                    // Show browser notification if supported
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('Reminder', {
                            body: reminder.message
                        });
                    } else {
                        showNotification(`Reminder: ${reminder.message}`);
                    }
                }
            }, timeUntilReminder);
        }

        // Show Notification
        function showNotification(message) {
            notification.textContent = message;
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }

        // Validate Email
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        // Request notification permission
        function requestNotificationPermission() {
            if ('Notification' in window) {
                Notification.requestPermission();
            }
        }

        // Initialize
        function init() {
            renderReminders();
            requestNotificationPermission();
            
            // Set min date for date input to today
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            
            // Schedule existing reminders
            reminders.forEach(reminder => {
                if (reminder.status === 'pending') {
                    scheduleReminder(reminder);
                }
            });
        }

        // Run initialization
        init();