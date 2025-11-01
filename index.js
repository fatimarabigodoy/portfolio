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
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        // Mobile tap toggle for profile image
const aboutVisual = document.querySelector('.about-visual');
if (aboutVisual) {
    let isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    
    if (isMobile) {
        aboutVisual.addEventListener('click', function(e) {
            e.preventDefault();
            this.classList.toggle('tapped');
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                this.classList.remove('tapped');
            }, 3000);
        });
    }
}