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
        
        // Comic Carousel Functionality
        class ComicCarousel {
            constructor(carouselElement) {
                this.carousel = carouselElement;
                this.slides = carouselElement.querySelectorAll('.comic-slide');
                this.indicators = carouselElement.parentElement.querySelectorAll('.indicator');
                this.prevButton = carouselElement.parentElement.querySelector('.carousel-arrow-prev');
                this.nextButton = carouselElement.parentElement.querySelector('.carousel-arrow-next');
                
                this.currentSlide = 0;
                this.totalSlides = this.slides.length;
                this.isTransitioning = false;
                
                // Touch/swipe handling
                this.startX = 0;
                this.startY = 0;
                this.endX = 0;
                this.endY = 0;
                this.threshold = 50; // Minimum swipe distance
                
                this.init();
            }
            
            init() {
                // Button event listeners
                this.prevButton.addEventListener('click', () => this.prevSlide());
                this.nextButton.addEventListener('click', () => this.nextSlide());
                
                // Indicator event listeners
                this.indicators.forEach((indicator, index) => {
                    indicator.addEventListener('click', () => this.goToSlide(index));
                });
                
                // Keyboard navigation
                document.addEventListener('keydown', (e) => {
                    if (this.isCarouselInView()) {
                        if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            this.prevSlide();
                        } else if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            this.nextSlide();
                        }
                    }
                });
                
                // Touch events for mobile swiping
                this.carousel.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
                this.carousel.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
                this.carousel.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
                
                // Mouse events for desktop dragging (optional)
                this.carousel.addEventListener('mousedown', (e) => this.handleMouseStart(e));
                this.carousel.addEventListener('mousemove', (e) => this.handleMouseMove(e));
                this.carousel.addEventListener('mouseup', (e) => this.handleMouseEnd(e));
                this.carousel.addEventListener('mouseleave', (e) => this.handleMouseEnd(e));
                
                // Initialize first slide
                this.updateSlides();
            }
            
            isCarouselInView() {
                const rect = this.carousel.getBoundingClientRect();
                const windowHeight = window.innerHeight || document.documentElement.clientHeight;
                return rect.top < windowHeight && rect.bottom > 0;
            }
            
            nextSlide() {
                if (this.isTransitioning) return;
                this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
                this.updateSlides();
            }
            
            prevSlide() {
                if (this.isTransitioning) return;
                this.currentSlide = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
                this.updateSlides();
            }
            
            goToSlide(index) {
                if (this.isTransitioning || index === this.currentSlide) return;
                this.currentSlide = index;
                this.updateSlides();
            }
            
            updateSlides() {
                this.isTransitioning = true;
                
                // Update slides
                this.slides.forEach((slide, index) => {
                    slide.classList.remove('active', 'prev');
                    if (index === this.currentSlide) {
                        slide.classList.add('active');
                    } else if (index < this.currentSlide) {
                        slide.classList.add('prev');
                    }
                });
                
                // Update indicators
                this.indicators.forEach((indicator, index) => {
                    indicator.classList.toggle('active', index === this.currentSlide);
                });
                
                // Reset transition flag after animation
                setTimeout(() => {
                    this.isTransitioning = false;
                }, 500);
            }
            
            // Touch handling
            handleTouchStart(e) {
                this.startX = e.touches[0].clientX;
                this.startY = e.touches[0].clientY;
                this.carousel.classList.add('swiping');
            }
            
            handleTouchMove(e) {
                if (!this.startX || !this.startY) return;
                
                this.endX = e.touches[0].clientX;
                this.endY = e.touches[0].clientY;
            }
            
            handleTouchEnd(e) {
                if (!this.startX || !this.endX) return;
                
                const deltaX = this.startX - this.endX;
                const deltaY = Math.abs(this.startY - this.endY);
                
                // Only trigger swipe if horizontal movement is greater than vertical
                if (Math.abs(deltaX) > this.threshold && Math.abs(deltaX) > deltaY) {
                    if (deltaX > 0) {
                        this.nextSlide(); // Swipe left = next slide
                    } else {
                        this.prevSlide(); // Swipe right = previous slide
                    }
                }
                
                this.startX = 0;
                this.startY = 0;
                this.endX = 0;
                this.endY = 0;
                this.carousel.classList.remove('swiping');
            }
            
            // Mouse handling (for desktop drag)
            handleMouseStart(e) {
                e.preventDefault();
                this.startX = e.clientX;
                this.isMouseDown = true;
                this.carousel.style.cursor = 'grabbing';
            }
            
            handleMouseMove(e) {
                if (!this.isMouseDown) return;
                this.endX = e.clientX;
            }
            
            handleMouseEnd(e) {
                if (!this.isMouseDown) return;
                
                const deltaX = this.startX - this.endX;
                
                if (Math.abs(deltaX) > this.threshold) {
                    if (deltaX > 0) {
                        this.nextSlide();
                    } else {
                        this.prevSlide();
                    }
                }
                
                this.isMouseDown = false;
                this.startX = 0;
                this.endX = 0;
                this.carousel.style.cursor = 'grab';
            }
        }
        
        // Initialize carousel when page loads
        document.addEventListener('DOMContentLoaded', function() {
            const carouselElement = document.getElementById('comic-carousel');
            if (carouselElement) {
                new ComicCarousel(carouselElement);
            }
        });
        
    // Modal functionality
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Close modal when clicking outside the content
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});