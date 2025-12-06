// Variable global para almacenar todas las tareas principales
let tasks = [];
const STORAGE_KEY = 'smartTaskCounter_tasks';
let currentFilter = 'all'; 

// FUNCIÓN DE INICIALIZACIÓN: Carga datos al iniciar
function init() {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
    
    // Iniciar el renderizado y el contador de alarma
    renderTasks();
    updateGlobalCounter(); 
}

// FUNCIÓN PRINCIPAL DE GESTIÓN DE DATOS
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    updateGlobalCounter(); 
}

// AÑADIR TAREA PRINCIPAL 
function addTask() {
    const titleInput = document.getElementById('task-title');
    const prioritySelect = document.getElementById('task-priority');
    const deadlineInput = document.getElementById('task-deadline'); 

    const title = titleInput.value.trim();
    const priority = prioritySelect.value;
    const deadline = deadlineInput.value; 

    // Validación de entrada
    if (title === "" || priority === "") {
        alert("¡Alerta! Debes ingresar un título y seleccionar una prioridad para la tarea principal");
        return;
    }

    const newTask = {
        id: Date.now(), 
        title: title,
        priority: priority, 
        deadline: deadline, 
        subtasks: [], 
        isCompleted: false 
    };

    tasks.push(newTask);
    
    // Limpiar inputs
    titleInput.value = "";
    prioritySelect.selectedIndex = 0;
    deadlineInput.value = ""; 

    saveTasks();
    renderTasks();
}

// PRIORIDAD DINÁMICA INTELIGENTE
function getDynamicPriority(task) {
    // Si ya está completada, no cambiamos nada
    if (task.isCompleted) return task.priority; 

    // Si no tiene plazo, mantenemos su prioridad original
    if (!task.deadline) return task.priority;

    const deadlineTime = new Date(task.deadline).getTime();
    const now = new Date().getTime();
    const timeLeft = deadlineTime - now;
    
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const THREE_DAYS = 3 * ONE_DAY;
    const SEVEN_DAYS = 7 * ONE_DAY;

    // Tarea vencida o a menos de 1 día: SIEMPRE ALTA
    if (timeLeft <= ONE_DAY) {
        return 'alta';
    }
    // Tarea a menos de 3 días: Prioridad mínima media
    else if (timeLeft < THREE_DAYS) {
        // Si era baja, se convierte en media, si era media o alta, se mantiene
        if (task.priority === 'baja') return 'media';
    }
    // Tarea a menos de 7 días: Prioridad mínima baja
    else if (timeLeft < SEVEN_DAYS) {
        // Si era media o alta, se mantiene, no hacemos nada si es baja
    }
    
    // Si no se cumple ninguna condición, devuelve la prioridad original
    return task.priority;
}

function addSubtask(taskId) {
    const inputId = `subtask-input-${taskId}`;
    const subtaskInput = document.getElementById(inputId);
    const title = subtaskInput.value.trim();

    if (title === "") {
        alert("¡Alerta! La sub-tarea no puede estar vacía");
        return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const newSubtask = {
            id: Date.now() + Math.random(),
            title: title,
            completed: false
        };
        task.subtasks.push(newSubtask);

        if (task.isCompleted) {
             task.isCompleted = false;
        }

        subtaskInput.value = "";
        saveTasks();
        renderTasks();
    }
}

function editTaskTitle(element, taskId) {
    const newTitle = element.textContent.trim();
    const task = tasks.find(t => t.id === taskId);

    if (task && newTitle !== task.title && newTitle !== "") {
        task.title = newTitle;
        saveTasks();
    } else if (newTitle === "") {
        alert("El título de la tarea no puede estar vacío");
        element.textContent = task.title; 
    }
}

function editSubtaskTitle(element, taskId, subtaskId) {
    const newTitle = element.textContent.trim();
    const task = tasks.find(t => t.id === taskId);

    if (task && newTitle !== "") {
        const subtask = task.subtasks.find(s => s.id === subtaskId);
        if (subtask && newTitle !== subtask.title) {
             subtask.title = newTitle;
             saveTasks();
        } else if (newTitle === "") {
            alert("El título de la sub-tarea no puede estar vacío");
            element.textContent = subtask.title; 
        }
    }
}

function deleteTask(taskId) {
    if (confirm("¿Estás seguro de que deseas eliminar permanentemente esta tarea principal y todas sus sub-tareas?")) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
    }
}

function toggleSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const subtask = task.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
            subtask.completed = !subtask.completed; 
        }
        updateTaskProgress(task); 
        saveTasks();
        renderTasks();
    }
}

function updateTaskProgress(task) {
    if (task.subtasks.length === 0) {
        task.isCompleted = false;
        return;
    }

    const completed = task.subtasks.filter(sub => sub.completed).length;
    const total = task.subtasks.length;
    const percentage = Math.round((completed / total) * 100);

    task.isCompleted = percentage === 100;
}

function renderDeadline(task) {
    if (!task.deadline || task.isCompleted) return '';
    
    const deadlineTime = new Date(task.deadline).getTime();
    const now = new Date().getTime();
    const timeLeft = deadlineTime - now;

    let text = '';
    let className = 'deadline-ok';
    const ONE_DAY = 24 * 60 * 60 * 1000;

    if (timeLeft <= 0) {
        text = '¡VENCIDA! ' + new Date(task.deadline).toLocaleString();
        className = 'deadline-warning';
    } 
    else if (timeLeft < ONE_DAY) { 
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        text = `¡ALERTA! Vence en ${hours}h ${minutes}m`;
        className = 'deadline-warning'; 
    } 
    else {
        const days = Math.floor(timeLeft / ONE_DAY);
        const dateStr = new Date(task.deadline).toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
        text = `Plazo: ${days} días (${dateStr})`;
    }

    return `<span class="deadline-info ${className}"><i class="fas fa-calendar-alt"></i> ${text}</span>`;
}

// Alarma constante: Actualiza el renderizado cada minuto
setInterval(renderTasks, 60000); 

function searchTasks() {
    renderTasks(); 
}

function filterTasks(filterType) {
    currentFilter = filterType;
    
    document.querySelectorAll('.filters button').forEach(button => {
        button.classList.remove('active');
    });
    const activeBtn = Array.from(document.querySelectorAll('.filters button')).find(btn => 
        btn.onclick.toString().includes(`'${filterType}'`)
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    renderTasks();
}

// CONTADOR GLOBAL
function updateGlobalCounter() {
    const totalPrincipal = tasks.length;
    const completedPrincipal = tasks.filter(t => t.isCompleted).length;
    const counterElement = document.getElementById('global-counter');
    
    counterElement.textContent = `✨ Progreso Global: Has completado ${completedPrincipal} de ${totalPrincipal} tareas principales. ✨`;
}

// RENDERIZADO PRIORIDAD DINÁMICA
function renderTasks() {
    document.querySelectorAll('.task-list').forEach(ul => ul.innerHTML = '');
    
    const searchInput = document.getElementById('task-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    const filteredTasks = tasks.filter(task => {
        
        // Búsqueda
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                              (task.deadline && task.deadline.includes(searchTerm)) ||
                              task.subtasks.some(sub => sub.title.toLowerCase().includes(searchTerm));
        if (!matchesSearch) return false;

        // Filtro de estado 
        if (currentFilter === 'all') return true;
        if (currentFilter === 'pending') return !task.isCompleted;
        if (currentFilter === 'completed') return task.isCompleted;
        return true;
    });
    
    filteredTasks.forEach(task => {
        updateTaskProgress(task); 
        
        const renderPriority = getDynamicPriority(task); 

        const listItem = document.createElement('li');
        listItem.className = `main-task priority-${renderPriority} ${task.isCompleted ? 'completed-task' : ''}`;
        listItem.setAttribute('data-id', task.id);
        
        const priorityTag = (renderPriority !== task.priority) 
            ? `<small style="font-style: italic; color: ${renderPriority === 'alta' ? '#e74c3c' : '#f39c12'};"> (Prioridad Ajustada: ${renderPriority.toUpperCase()})</small>` 
            : '';

        let taskHTML = `
            <div>
                <h3 contenteditable="true" onblur="editTaskTitle(this, ${task.id})">${task.title} ${priorityTag}</h3>
                <button class="delete-btn" onclick="deleteTask(${task.id})"><i class="fas fa-trash-alt"></i> Eliminar </button>
            </div>
            
            ${renderDeadline(task)} 
            ${renderProgressBar(task)}
            
            <div class="subtask-management">
                <h4><i class="fas fa-tasks"></i> Pasos</h4>
                <div>
                    <input type="text" id="subtask-input-${task.id}" placeholder="Nuevo paso/sub-tarea">
                    <button onclick="addSubtask(${task.id})"><i class="fas fa-plus"></i> Añadir</button>
                </div>
                <ul id="subtask-list-${task.id}">
                    ${renderSubtasks(task)}
                </ul>
            </div>
        `;

        listItem.innerHTML = taskHTML;
        
        // Determinar a qué lista inyectar la tarea según la prioridad dinámica
        const targetList = document.querySelector(`.task-list[data-priority="${renderPriority}"]`);
        if (targetList) {
            targetList.appendChild(listItem);
        }
    });

    updateGlobalCounter(); 
}

// Funciones Helper

function renderSubtasks(task) {
    let subtasksHTML = '';
    task.subtasks.forEach(subtask => {
        subtasksHTML += `
            <li>
                <input 
                    type="checkbox" 
                    id="subtask-${subtask.id}"
                    ${subtask.completed ? 'checked' : ''} 
                    onchange="toggleSubtask(${task.id}, ${subtask.id})"
                >
                <label 
                    for="subtask-${subtask.id}" 
                    contenteditable="true"
                    onblur="editSubtaskTitle(this, ${task.id}, ${subtask.id})"
                    style="${subtask.completed ? 'text-decoration: line-through; color: #7f8c8d;' : ''}"
                >
                    ${subtask.title}
                </label>
            </li>
        `;
    });
    return subtasksHTML;
}

function renderProgressBar(task) {
    const total = task.subtasks.length;
    if (total === 0) {
        return `<p class="progress-info">Aún no hay pasos definidos. 0% completado.</p>`;
    }
    
    const completed = task.subtasks.filter(sub => sub.completed).length;
    const percentage = Math.round((completed / total) * 100); 

    return `
        <p class="progress-info">Progreso: ${percentage}%</p>
        <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${percentage}%;"></div>
        </div>
    `;
}

// REGISTRO PWA (SERVICE WORKER)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.log('Fallo en el registro de ServiceWorker:', error);
      });
  });
}

// Variable para guardar el evento de instalación
let deferredPrompt; 
const installSection = document.getElementById('install-section'); 

// 1. CAPTURAR EL EVENTO: Evitamos el banner automático y guardamos el evento
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // Guardamos el evento para poder llamarlo con el botón
  deferredPrompt = e;
  // Hacemos visible la sección de instalación
  installSection.style.display = 'block'; 
});

// 2. FUNCIÓN DE INSTALACIÓN: Llamada cuando el usuario pulsa el botón
function installApp() {
  if (deferredPrompt) {
    // Muestra el diálogo de instalación
    deferredPrompt.prompt(); 
    
    // Oculta el botón personalizado después de mostrar el prompt
    installSection.style.display = 'none'; 
    
    // Reseteamos la variable, ya que solo se puede usar una vez
    deferredPrompt = null;
  }
}
// Llamada de inicio
init();