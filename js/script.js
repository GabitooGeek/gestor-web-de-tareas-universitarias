document.addEventListener('DOMContentLoaded', () => {
    // --- Selección de Elementos del DOM ---
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const subjectInput = document.getElementById('subject-input');
    const deadlineInput = document.getElementById('deadline-input');
    const taskList = document.getElementById('task-list');
    const currentDateElement = document.getElementById('current-date');

    // --- Mostrar fecha y hora actual (actualizado cada segundo) ---
    updateDateTime(); // Muestra la hora inmediatamente
    setInterval(updateDateTime, 1000); // Actualiza cada segundo

    // --- Cargar tareas desde Local Storage al iniciar ---
    loadTasks();

    // --- Event Listener para el formulario ---
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(taskInput.value, subjectInput.value, deadlineInput.value);
        taskInput.value = '';
        subjectInput.value = '';
        deadlineInput.value = '';
        taskInput.focus();
    });

    // --- Event Listener para los botones de las tareas ---
    taskList.addEventListener('click', (e) => {
        const target = e.target;
        const taskItem = target.closest('li');
        if (!taskItem) return;

        if (target.closest('.complete-btn')) {
            taskItem.classList.toggle('completed');
            updateTaskStatus(taskItem);
            saveTasks();
        }

        if (target.closest('.delete-btn')) {
            taskItem.style.transition = 'opacity 0.3s, transform 0.3s';
            taskItem.style.opacity = '0';
            taskItem.style.transform = 'translateX(20px)';
            setTimeout(() => {
                taskItem.remove();
                saveTasks();
            }, 300);
        }
    });

    /**
     * Muestra la fecha y hora actual formateada.
     */
    function updateDateTime() {
        const now = new Date();
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const dateString = now.toLocaleDateString('es-ES', dateOptions);
        const timeString = now.toLocaleTimeString('es-ES', timeOptions);
        currentDateElement.textContent = `${dateString} | ${timeString}`;
    }

    /**
     * Añade una nueva tarea a la lista del DOM.
     */
    function addTask(taskText, subjectText, deadline, isCompleted = false) {
        if (taskText.trim() === '') {
            alert('Por favor, escribe una tarea.');
            return;
        }

        const taskItem = document.createElement('li');
        if (deadline) {
            taskItem.dataset.deadline = deadline;
        }
        if (isCompleted) {
            taskItem.classList.add('completed');
        }

        taskItem.innerHTML = `
            <div class="task-content">
                <span>${escapeHTML(taskText)}</span>
                ${subjectText ? `<div class="subject">${escapeHTML(subjectText)}</div>` : ''}
                <div class="task-deadline"></div>
            </div>
            <div class="task-actions">
                <button class="complete-btn" title="Marcar como completada">
                    <i class="fas fa-check-circle"></i>
                </button>
                <button class="delete-btn" title="Eliminar tarea">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;

        taskList.appendChild(taskItem);
        updateTaskStatus(taskItem);
        saveTasks();
    }

    /**
     * Guarda todas las tareas actuales en Local Storage.
     */
    function saveTasks() {
        const tasks = [];
        document.querySelectorAll('#task-list li').forEach(taskItem => {
            tasks.push({
                text: taskItem.querySelector('.task-content span').textContent,
                subject: taskItem.querySelector('.task-content .subject')?.textContent || '',
                deadline: taskItem.dataset.deadline || '',
                completed: taskItem.classList.contains('completed')
            });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    /**
     * Carga las tareas desde Local Storage.
     */
    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => {
            addTask(task.text, task.subject, task.deadline, task.completed);
        });
    }

    /**
     * Actualiza el estado visual de una tarea (urgente, vencida) y el tiempo restante.
     */
    function updateTaskStatus(taskItem) {
        const deadline = taskItem.dataset.deadline;
        const deadlineTextElement = taskItem.querySelector('.task-deadline');
        if (!deadline || taskItem.classList.contains('completed')) {
            taskItem.classList.remove('urgent', 'overdue');
            if (deadlineTextElement) deadlineTextElement.innerHTML = '';
            return;
        }

        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - now;

        taskItem.classList.remove('urgent', 'overdue');

        if (diffTime < 0) {
            taskItem.classList.add('overdue');
            statusText = `<i class="fas fa-exclamation-circle"></i> Vencido.`;
        } else {
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffTime / (1000 * 60 * 60)) % 24);
            
            let statusText = '';
            if (diffDays === 0 && diffHours < 12) {
                taskItem.classList.add('overdue'); // Urgencia máxima
                statusText = `<i class="fas fa-exclamation-triangle"></i> ¡Vence en menos de 12 horas!`;
            } else if (diffDays < 3) {
                taskItem.classList.add('urgent');
                statusText = `<i class="fas fa-clock"></i> Vence en ${diffDays} día(s) y ${diffHours} hora(s)`;
            } else {
                statusText = `<i class="fas fa-calendar-alt"></i> Vence en ${diffDays} día(s)`;
            }
            if (deadlineTextElement) deadlineTextElement.innerHTML = statusText;
        }
    }

    /**
     * Escapa caracteres HTML para prevenir ataques XSS.
     */
    function escapeHTML(str) {
        const p = document.createElement('p');
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }
});