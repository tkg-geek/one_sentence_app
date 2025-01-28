class FullscreenManager {
    constructor() {
        this.fullscreenView = document.getElementById('fullscreenView');
        this.fullscreenText = this.fullscreenView.querySelector('.fullscreen-text');
        this.currentIndex = 0;
        this.texts = [];
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // タッチイベントの設定
        this.fullscreenView.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
        }, { passive: false });

        this.fullscreenView.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            
            // スワイプの方向を判定
            const swipeDistance = touchEndX - this.touchStartX;
            if (Math.abs(swipeDistance) < 50) {
                // タップとして処理
                this.handleScreenTap(touchEndX);
            } else {
                // スワイプとして処理
                if (swipeDistance > 0) {
                    this.showPrevious();
                } else {
                    this.showNext();
                }
            }
        }, { passive: false });

        // デスクトップ用のクリックイベント
        if (!this.isIOS()) {
            this.fullscreenView.addEventListener('click', (e) => {
                this.handleScreenTap(e.clientX);
            });
        }
    }

    handleScreenTap(x) {
        const halfWidth = window.innerWidth / 2;
        if (x > halfWidth) {
            this.showNext();
        } else {
            this.showPrevious();
        }
    }

    start() {
        this.texts = Array.from(document.querySelectorAll('.text-input'))
            .map(input => input.value)
            .filter(text => text.trim() !== '');

        if (this.texts.length === 0) return;

        this.currentIndex = 0;
        this.fullscreenView.classList.remove('hidden');
        this.showCurrent();

        // iOSの場合はフルスクリーンAPIを使用しない
        if (!this.isIOS()) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen()
                    .catch(err => console.log('フルスクリーンモードを開始できませんでした:', err));
            }
        }
    }

    isIOS() {
        return [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
        ].includes(navigator.platform)
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    }

    showCurrent() {
        this.fullscreenText.textContent = this.texts[this.currentIndex];
    }

    showNext() {
        if (this.currentIndex < this.texts.length - 1) {
            this.currentIndex++;
            this.showCurrent();
        } else {
            this.exit();
        }
    }

    showPrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.showCurrent();
        } else {
            this.exit();
        }
    }

    exit() {
        this.fullscreenView.classList.add('hidden');
        
        // フルスクリーンモードを終了
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }

        // 画面の向きのロックを解除
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }
}

// フルスクリーンマネージャーの初期化
document.addEventListener('DOMContentLoaded', () => {
    const fullscreenManager = new FullscreenManager();
    document.getElementById('playButton').addEventListener('click', () => {
        fullscreenManager.start();
    });
}); 