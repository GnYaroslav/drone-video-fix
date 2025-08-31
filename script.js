// Language switching functionality
class LanguageManager {
    constructor() {
        this.currentLang = 'ru';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateContent();
    }

    bindEvents() {
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.switchLanguage(lang);
            });
        });
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        
        // Update active button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang;
        
        this.updateContent();
    }

    updateContent() {
        const elements = document.querySelectorAll('[data-ru], [data-en]');
        elements.forEach(element => {
            const ruText = element.dataset.ru;
            const enText = element.dataset.en;
            
            if (this.currentLang === 'ru' && ruText) {
                element.textContent = ruText;
            } else if (this.currentLang === 'en' && enText) {
                element.textContent = enText;
            }
        });

        // Update placeholders
        const inputs = document.querySelectorAll('[data-ru-placeholder], [data-en-placeholder]');
        inputs.forEach(input => {
            const ruPlaceholder = input.dataset.ruPlaceholder;
            const enPlaceholder = input.dataset.enPlaceholder;
            
            if (this.currentLang === 'ru' && ruPlaceholder) {
                input.placeholder = ruPlaceholder;
            } else if (this.currentLang === 'en' && enPlaceholder) {
                input.placeholder = enPlaceholder;
            }
        });
    }
}

// File upload functionality
class FileUploadManager {
    constructor() {
        this.damagedFile = null;
        this.workingFile = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Damaged file zone
        const damagedZone = document.getElementById('damagedFileZone');
        const damagedInput = document.getElementById('damagedFile');
        
        damagedZone.addEventListener('click', () => damagedInput.click());
        damagedInput.addEventListener('change', (e) => this.handleFileSelect(e, 'damaged'));
        this.setupDragAndDrop(damagedZone, 'damaged');

        // Working file zone
        const workingZone = document.getElementById('workingFileZone');
        const workingInput = document.getElementById('workingFile');
        
        workingZone.addEventListener('click', () => workingInput.click());
        workingInput.addEventListener('change', (e) => this.handleFileSelect(e, 'working'));
        this.setupDragAndDrop(workingZone, 'working');

        // Start recovery button
        document.getElementById('startRecovery').addEventListener('click', () => this.startRecovery());
    }

    setupDragAndDrop(zone, type) {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0], type);
            }
        });
    }

    handleFileSelect(event, type) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file, type);
        }
    }

    async handleFile(file, type) {
        if (!file.type.startsWith('video/')) {
            this.showNotification(
                window.languageManager.currentLang === 'ru' ? 'Пожалуйста, выберите видео файл' : 'Please select a video file',
                'error'
            );
            return;
        }

        // Показываем лоадер загрузки
        const uploadLoader = document.getElementById('uploadLoader');
        uploadLoader.style.display = 'block';

        try {
            // Загружаем файл на сервер
            const formData = new FormData();
            formData.append(type === 'damaged' ? 'damagedFile' : 'workingFile', file);

            const endpoint = type === 'damaged' ? 'http://localhost:3000/api/upload-damaged' : 'http://localhost:3000/api/upload-working';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Сохраняем информацию о загруженном файле
                if (type === 'damaged') {
                    this.damagedFile = { ...file, serverInfo: result.file };
                } else {
                    this.workingFile = { ...file, serverInfo: result.file };
                }

                this.updateFileInfo(file, type);
                
                this.showNotification(
                    window.languageManager.currentLang === 'ru' ? 'Файл успешно загружен на сервер' : 'File successfully uploaded to server',
                    'success'
                );
            } else {
                throw new Error(result.error || 'Ошибка загрузки');
            }
        } catch (error) {
            console.error('Ошибка загрузки файла:', error);
            this.showNotification(
                window.languageManager.currentLang === 'ru' ? 'Ошибка загрузки файла: ' + error.message : 'File upload error: ' + error.message,
                'error'
            );
        } finally {
            // Скрываем лоадер
            uploadLoader.style.display = 'none';
        }
    }

    updateFileInfo(file, type) {
        const infoElement = document.getElementById(type === 'damaged' ? 'damagedFileInfo' : 'workingFileInfo');
        const nameElement = infoElement.querySelector('.file-name');
        const sizeElement = infoElement.querySelector('.file-size');

        nameElement.textContent = file.name;
        sizeElement.textContent = this.formatFileSize(file.size);
        infoElement.style.display = 'flex';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async startRecovery() {
        if (!this.damagedFile || !this.damagedFile.serverInfo) {
            this.showNotification(
                window.languageManager.currentLang === 'ru' ? 'Пожалуйста, загрузите поврежденный файл на сервер' : 'Please upload damaged file to server',
                'error'
            );
            return;
        }

        // Check if at least one contact method is provided
        const email = document.getElementById('userEmail').value;
        const telegram = document.getElementById('userTelegram').value;
        
        if (!email && !telegram) {
            this.showNotification(
                window.languageManager.currentLang === 'ru' ? 'Пожалуйста, укажите хотя бы один способ связи (email или telegram)' : 'Please provide at least one contact method (email or telegram)',
                'error'
            );
            return;
        }

        // Validate email if provided
        if (email && !this.isValidEmail(email)) {
            this.showNotification(
                window.languageManager.currentLang === 'ru' ? 'Пожалуйста, введите корректный email' : 'Please enter a valid email',
                'error'
            );
            return;
        }

        // Show progress bar
        const btn = document.getElementById('startRecovery');
        const progressContainer = document.getElementById('recoveryProgress');
        
        btn.style.display = 'none';
        progressContainer.style.display = 'block';

        try {
            // Отправляем запрос на восстановление
            const response = await fetch('http://localhost:3000/api/start-recovery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    damagedFile: this.damagedFile.serverInfo.filename,
                    workingFile: this.workingFile?.serverInfo?.filename || null,
                    email: email,
                    telegram: telegram
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('Восстановление запущено:', result);
                // Запускаем симуляцию прогресса
                this.simulateRecoveryProgress();
            } else {
                throw new Error(result.error || 'Ошибка запуска восстановления');
            }
        } catch (error) {
            console.error('Ошибка запуска восстановления:', error);
            this.showNotification(
                window.languageManager.currentLang === 'ru' ? 'Ошибка запуска восстановления: ' + error.message : 'Error starting recovery: ' + error.message,
                'error'
            );
            
            // Показываем кнопку обратно
            btn.style.display = 'inline-block';
            progressContainer.style.display = 'none';
        }
    }

    startProcessing() {
        // Hide upload loader, show progress bar
        const uploadLoader = document.getElementById('uploadLoader');
        const progressContainer = document.getElementById('recoveryProgress');
        
        uploadLoader.style.display = 'none';
        progressContainer.style.display = 'block';

        // Simulate recovery process with progress
        this.simulateRecoveryProgress();
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    simulateRecoveryProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const steps = document.querySelectorAll('.step-item');
        
        let progress = 0;
        let currentStep = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5; // Random progress between 5-20%
            
            if (progress > 100) progress = 100;
            
            progressFill.style.width = progress + '%';
            progressPercentage.textContent = Math.round(progress) + '%';
            
            // Update steps
            const stepProgress = progress / 25; // 4 steps, so 25% each
            const newCurrentStep = Math.min(Math.floor(stepProgress), 3);
            
            if (newCurrentStep > currentStep) {
                steps[currentStep].classList.remove('active');
                steps[currentStep].classList.add('completed');
                currentStep = newCurrentStep;
                if (currentStep < steps.length) {
                    steps[currentStep].classList.add('active');
                }
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                steps[3].classList.remove('active');
                steps[3].classList.add('completed');
                
                setTimeout(() => {
                    this.completeRecovery();
                }, 1000);
            }
        }, 200);
    }

    completeRecovery() {
        // Send file info to Telegram
        this.sendToTelegram();
        
        // Show success popup
        const popup = document.getElementById('successPopup');
        popup.style.display = 'flex';
        
        // Reset everything after a delay
        setTimeout(() => {
            this.resetEverything();
        }, 1000);
    }

    sendToTelegram() {
        const email = document.getElementById('userEmail').value;
        const telegram = document.getElementById('userTelegram').value;
        const damagedFileName = this.damagedFile?.serverInfo?.originalName || this.damagedFile?.name || 'N/A';
        const workingFileName = this.workingFile?.serverInfo?.originalName || this.workingFile?.name || 'N/A';
        const damagedFileSize = this.damagedFile?.serverInfo?.size ? this.formatFileSize(this.damagedFile.serverInfo.size) : 'N/A';
        const serverFilename = this.damagedFile?.serverInfo?.filename || 'N/A';

        // Create message for Telegram
        const message = `🎬 Новая заявка на восстановление видео:

📧 Email: ${email}
📱 Telegram: ${telegram || 'Не указан'}

📁 Поврежденный файл: ${damagedFileName}
📊 Размер: ${damagedFileSize}
📁 Рабочий файл: ${workingFileName}
🆔 Серверное имя: ${serverFilename}

⏰ Время: ${new Date().toLocaleString('ru-RU')}

#DroneVideoFix #Заявка`;

        // Real Telegram Bot API implementation
        const BOT_TOKEN = '8272202383:AAEwLuR0WnOZVuwEr3bo3VdItXMJR16Dqag';
        const CHAT_ID = '173817209'; // Chat ID for @GnatyukYa
        
        console.log('Отправка в Telegram @gnatyukya:', message);
        
        // Send to Telegram
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        }).then(response => response.json())
          .then(data => {
              if (data.ok) {
                  console.log('✅ Успешно отправлено в Telegram:', data);
                  this.showNotification(
                      window.languageManager.currentLang === 'ru' ? 'Уведомление отправлено в Telegram!' : 'Notification sent to Telegram!',
                      'success'
                  );
              } else {
                  console.error('❌ Ошибка отправки в Telegram:', data);
                  this.showNotification(
                      window.languageManager.currentLang === 'ru' ? 'Ошибка отправки в Telegram' : 'Error sending to Telegram',
                      'error'
                  );
              }
          })
          .catch(error => {
              console.error('❌ Ошибка сети:', error);
              this.showNotification(
                  window.languageManager.currentLang === 'ru' ? 'Ошибка сети при отправке' : 'Network error while sending',
                  'error'
              );
          });
    }

    resetEverything() {
        const btn = document.getElementById('startRecovery');
        const progressContainer = document.getElementById('recoveryProgress');
        
        btn.style.display = 'inline-block';
        progressContainer.style.display = 'none';
        
        // Reset progress
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressPercentage').textContent = '0%';
        
        // Reset steps
        const steps = document.querySelectorAll('.step-item');
        steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index === 0) step.classList.add('active');
        });
        
        // Reset files and form
        this.resetFiles();
        document.getElementById('userEmail').value = '';
        document.getElementById('userTelegram').value = '';
    }

    resetFiles() {
        this.damagedFile = null;
        this.workingFile = null;
        
        document.getElementById('damagedFileInfo').style.display = 'none';
        document.getElementById('workingFileInfo').style.display = 'none';
        
        document.getElementById('damagedFile').value = '';
        document.getElementById('workingFile').value = '';
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Contact form functionality
class ContactFormManager {
    constructor() {
        this.init();
    }

    init() {
        const form = document.getElementById('contactForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = {
            name: formData.get('name') || document.getElementById('name').value,
            email: formData.get('email') || document.getElementById('email').value,
            message: formData.get('message') || document.getElementById('message').value
        };

        // Validate form
        if (!data.name || !data.email || !data.message) {
            this.showNotification(
                this.currentLang === 'ru' ? 'Пожалуйста, заполните все поля' : 'Please fill in all fields',
                'error'
            );
            return;
        }

        if (!this.isValidEmail(data.email)) {
            this.showNotification(
                this.currentLang === 'ru' ? 'Пожалуйста, введите корректный email' : 'Please enter a valid email',
                'error'
            );
            return;
        }

        // Show success message
        this.showNotification(
            this.currentLang === 'ru' ? 'Сообщение отправлено! Мы свяжемся с вами в ближайшее время.' : 'Message sent! We will contact you soon.',
            'success'
        );

        // Reset form
        event.target.reset();
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Smooth scrolling for navigation links
class SmoothScroller {
    constructor() {
        this.init();
    }

    init() {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// Notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        background: #27ae60;
    }
    
    .notification-error {
        background: #e74c3c;
    }
    
    .notification-info {
        background: #3498db;
    }
`;

// Add notification styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Statistics counter animation
class StatisticsManager {
    constructor() {
        this.countersAnimated = false;
        this.init();
    }

    init() {
        this.observeCounters();
    }

    observeCounters() {
        const counters = document.querySelectorAll('.stat-number');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.countersAnimated) {
                    this.animateCounters();
                    this.countersAnimated = true;
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }

    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.count);
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.ceil(current);
                }
            }, 20);
        });
    }
}

// FAQ functionality
class FAQManager {
    constructor() {
        this.init();
    }

    init() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.parentElement;
                const isActive = faqItem.classList.contains('active');
                
                // Close all other FAQ items
                document.querySelectorAll('.faq-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Toggle current item
                if (!isActive) {
                    faqItem.classList.add('active');
                }
            });
        });
    }
}

// Popup manager
class PopupManager {
    constructor() {
        this.init();
    }

    init() {
        // Close popup button
        const closeBtn = document.getElementById('closePopup');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closePopup();
            });
        }

        // Close popup on overlay click
        const popup = document.getElementById('successPopup');
        if (popup) {
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    this.closePopup();
                }
            });
        }
    }

    closePopup() {
        const popup = document.getElementById('successPopup');
        popup.style.display = 'none';
    }
}

// Initialize all managers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
    window.fileUploadManager = new FileUploadManager();
    window.contactFormManager = new ContactFormManager();
    window.smoothScroller = new SmoothScroller();
    window.statisticsManager = new StatisticsManager();
    window.faqManager = new FAQManager();
    window.popupManager = new PopupManager();
});

// Add scroll effect to header
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.service-card, .step, .upload-form');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
