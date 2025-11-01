// Mobile menu functionality
        const menuToggle = document.querySelector('.menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', function() {
                const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
                menuToggle.setAttribute('aria-expanded', !expanded);
                
                if (!expanded) {
                    navMenu.style.display = 'flex';
                    navMenu.style.position = 'fixed';
                    navMenu.style.top = '70px';
                    navMenu.style.left = '0';
                    navMenu.style.right = '0';
                    navMenu.style.background = 'rgba(255, 255, 255, 0.95)';
                    navMenu.style.backdropFilter = 'blur(10px)';
                    navMenu.style.flexDirection = 'column';
                    navMenu.style.padding = 'var(--space-8)';
                    navMenu.style.gap = 'var(--space-4)';
                } else {
                    navMenu.style.display = 'none';
                }
            });
        }
        
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav') && menuToggle && navMenu) {
                menuToggle.setAttribute('aria-expanded', 'false');
                if (window.innerWidth < 768) {
                    navMenu.style.display = 'none';
                }
            }
        });
        
        window.addEventListener('resize', function() {
            if (navMenu && menuToggle && window.innerWidth >= 768) {
                navMenu.style.display = 'flex';
                navMenu.style.position = 'static';
                navMenu.style.flexDirection = 'row';
                navMenu.style.background = 'transparent';
                navMenu.style.padding = '0';
                navMenu.style.gap = 'var(--space-8)';
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Boot Camp Info Toggle
        function toggleBootCamp() {
            const info = document.getElementById('bootcamp-info');
            const button = document.querySelector('.info-button');
            
            if (info.classList.contains('expanded')) {
                info.classList.remove('expanded');
                button.textContent = '+ So what\'s Boot Camp?';
            } else {
                info.classList.add('expanded');
                button.textContent = '+ So what\'s Boot Camp?';
            }
        }