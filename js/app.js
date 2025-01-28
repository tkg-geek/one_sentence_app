document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');
    
    try {
        // Capacitorの初期化
        let App, Haptics;
        try {
            const cap = await import('@capacitor/app');
            const hap = await import('@capacitor/haptics');
            App = cap.App;
            Haptics = hap.Haptics;
            console.log('Capacitor modules imported successfully');
        } catch (e) {
            console.log('Capacitor import error:', e);
        }

        class TextEditor {
            constructor() {
                console.log('TextEditor constructor called');
                this.init();
                this.bindEvents();
                this.initSortable();
                this.setupKeyboardHandling();
            }

            init() {
                console.log('Initializing TextEditor');
                this.textAreas = document.getElementById('textAreas');
                this.addButton = document.getElementById('addButton');
                this.saveButton = document.getElementById('saveButton');
                this.deleteButton = document.getElementById('deleteButton');
                this.playButton = document.getElementById('playButton');
                
                // 要素の取得確認
                console.log('Elements found:', {
                    textAreas: !!this.textAreas,
                    addButton: !!this.addButton,
                    saveButton: !!this.saveButton,
                    deleteButton: !!this.deleteButton,
                    playButton: !!this.playButton
                });
                
                this.loadFromStorage();
            }

            initSortable() {
                Sortable.create(this.textAreas, {
                    animation: 150,
                    handle: '.drag-handle',
                    ghostClass: 'dragging',
                    dragClass: 'dragging',
                    onStart: (evt) => {
                        evt.item.classList.add('dragging');
                    },
                    onEnd: (evt) => {
                        evt.item.classList.remove('dragging');
                    }
                });
            }

            bindEvents() {
                console.log('Binding events');
                const buttons = [
                    { el: this.addButton, action: () => this.addTextField(), id: 'addButton' },
                    { el: this.saveButton, action: () => this.saveToStorage(), id: 'saveButton' },
                    { el: this.deleteButton, action: () => this.clearStorage(), id: 'deleteButton' },
                    { el: this.playButton, action: () => this.startFullscreen(), id: 'playButton' }
                ];

                buttons.forEach(({ el, action, id }) => {
                    if (!el) {
                        console.error(`Button ${id} not found`);
                        return;
                    }
                    console.log(`Setting up events for ${id}`);

                    const handleAction = (e) => {
                        console.log(`${id} action triggered`);
                        e.preventDefault();
                        e.stopPropagation();
                        action();
                    };

                    // モバイルデバイス用のタッチイベント
                    if ('ontouchstart' in window) {
                        let touchStarted = false;
                        
                        el.addEventListener('touchstart', (e) => {
                            console.log(`${id} touchstart triggered`);
                            touchStarted = true;
                            e.preventDefault();
                            e.stopPropagation();
                            el.style.opacity = '0.7';
                        }, { passive: false });

                        el.addEventListener('touchend', (e) => {
                            console.log(`${id} touchend triggered`);
                            if (touchStarted) {
                                touchStarted = false;
                                e.preventDefault();
                                e.stopPropagation();
                                el.style.opacity = '1.0';
                                handleAction(e);
                            }
                        }, { passive: false });

                        el.addEventListener('touchcancel', (e) => {
                            console.log(`${id} touchcancel triggered`);
                            touchStarted = false;
                            e.preventDefault();
                            e.stopPropagation();
                            el.style.opacity = '1.0';
                        });
                    }

                    // デスクトップ用のクリックイベント
                    el.addEventListener('click', handleAction);
                });

                console.log('Events binding completed');
                this.setupClearButton(this.textAreas.querySelector('.text-container'));
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
                || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
            }

            setupKeyboardHandling() {
                // キーボードが表示されたときの処理
                window.addEventListener('keyboardWillShow', () => {
                    document.body.classList.add('keyboard-visible');
                    this.adjustViewForKeyboard(true);
                });

                // キーボードが非表示になったときの処理
                window.addEventListener('keyboardWillHide', () => {
                    document.body.classList.remove('keyboard-visible');
                    this.adjustViewForKeyboard(false);
                });

                // 入力フィールドのフォーカス処理
                document.addEventListener('focusin', (e) => {
                    if (e.target.classList.contains('text-input')) {
                        this.adjustViewForKeyboard(true);
                    }
                });

                document.addEventListener('focusout', (e) => {
                    if (e.target.classList.contains('text-input')) {
                        this.adjustViewForKeyboard(false);
                    }
                });
            }

            adjustViewForKeyboard(isKeyboardVisible) {
                const mainElement = document.querySelector('main');
                if (isKeyboardVisible) {
                    // キーボードが表示されたときのスクロール調整
                    const activeElement = document.activeElement;
                    if (activeElement && activeElement.classList.contains('text-input')) {
                        setTimeout(() => {
                            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                    }
                    mainElement.style.paddingBottom = '200px'; // キーボード用の余白
                } else {
                    mainElement.style.paddingBottom = '0';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }

            addTextField() {
                console.log('Adding new text field');
                const container = document.createElement('div');
                container.className = 'text-container';

                const dragHandle = document.createElement('div');
                dragHandle.className = 'drag-handle';
                
                const dragDots = document.createElement('div');
                dragDots.className = 'drag-dots';
                dragHandle.appendChild(dragDots);

                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'text-input';
                input.placeholder = '+ テキストを追加する';
                
                // iOSのキーボード関連の属性を追加
                input.setAttribute('inputmode', 'text');
                input.setAttribute('enterkeyhint', 'done');

                const clearButton = document.createElement('button');
                clearButton.className = 'clear-button';
                clearButton.textContent = '✕';

                container.appendChild(dragHandle);
                container.appendChild(input);
                container.appendChild(clearButton);

                this.textAreas.appendChild(container);
                this.setupClearButton(container);
            }

            setupClearButton(container) {
                console.log('Setting up clear button');
                const clearButton = container.querySelector('.clear-button');
                const input = container.querySelector('.text-input');

                if (!clearButton || !input) {
                    console.error('Clear button or input not found in container');
                    return;
                }

                const clearAction = () => {
                    console.log('Clear action triggered');
                    if (container === this.textAreas.firstElementChild) {
                        console.log('Clearing first input value');
                        input.value = '';
                    } else {
                        console.log('Removing container');
                        container.remove();
                    }
                };

                clearButton.addEventListener('touchend', (e) => {
                    console.log('Clear button touchend triggered');
                    e.preventDefault();
                    e.stopPropagation();
                    clearButton.style.opacity = '1.0';
                    clearAction();
                }, { passive: false });

                clearButton.addEventListener('click', (e) => {
                    console.log('Clear button click triggered');
                    e.preventDefault();
                    e.stopPropagation();
                    clearAction();
                });

                clearButton.addEventListener('touchstart', (e) => {
                    console.log('Clear button touchstart triggered');
                    e.preventDefault();
                    e.stopPropagation();
                    clearButton.style.opacity = '0.7';
                }, { passive: false });

                console.log('Clear button setup completed');
            }

            saveToStorage() {
                const texts = Array.from(this.textAreas.querySelectorAll('.text-input'))
                    .map(input => input.value);
                localStorage.setItem('savedTexts', JSON.stringify(texts));
                alert('保存しました');
            }

            loadFromStorage() {
                const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
                savedTexts.forEach((text, index) => {
                    if (index === 0) {
                        this.textAreas.querySelector('.text-input').value = text;
                    } else {
                        this.addTextField();
                        const inputs = this.textAreas.querySelectorAll('.text-input');
                        inputs[inputs.length - 1].value = text;
                    }
                });
            }

            clearStorage() {
                localStorage.removeItem('savedTexts');
                Array.from(this.textAreas.querySelectorAll('.text-container')).forEach((container, index) => {
                    if (index === 0) {
                        container.querySelector('.text-input').value = '';
                    } else {
                        container.remove();
                    }
                });
                alert('削除しました');
            }

            startFullscreen() {
                console.log('Starting fullscreen mode');
                const fullscreenView = document.getElementById('fullscreenView');
                const fullscreenText = fullscreenView.querySelector('.fullscreen-text');

                // テキストの取得と準備
                const texts = Array.from(this.textAreas.querySelectorAll('.text-input'))
                    .map(input => input.value)
                    .filter(text => text.trim() !== '');

                if (texts.length === 0) {
                    console.log('No texts to display');
                    return;
                }

                let currentIndex = 0;

                const showCurrent = () => {
                    console.log('Showing text at index:', currentIndex);
                    fullscreenText.textContent = texts[currentIndex];
                    if (Haptics) {
                        Haptics.impact({ style: 'light' });
                    }
                };

                const exitFullscreen = () => {
                    console.log('Exiting fullscreen mode');
                    if (Haptics) {
                        Haptics.notification({ type: 'success' });
                    }
                    // すべてのイベントリスナーを削除
                    fullscreenView.removeEventListener('click', handleTap);
                    document.removeEventListener('touchstart', preventScroll, { passive: false });
                    fullscreenView.classList.add('hidden');
                };

                const handleNavigation = async (isForward) => {
                    console.log('Navigation:', isForward ? 'forward' : 'backward');
                    if (isForward) {
                        if (currentIndex < texts.length - 1) {
                            if (Haptics) {
                                await Haptics.impact({ style: 'medium' });
                            }
                            currentIndex++;
                            showCurrent();
                        } else {
                            exitFullscreen();
                        }
                    } else {
                        if (currentIndex > 0) {
                            if (Haptics) {
                                await Haptics.impact({ style: 'medium' });
                            }
                            currentIndex--;
                            showCurrent();
                        } else {
                            exitFullscreen();
                        }
                    }
                };

                // シンプルなタップハンドラー
                const handleTap = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const tapX = e.type === 'click' ? e.clientX : e.touches[0].clientX;
                    const halfWidth = window.innerWidth / 2;
                    const isRightSide = tapX > halfWidth;
                    
                    console.log('Tap detected on:', isRightSide ? 'right side' : 'left side');
                    
                    if (Haptics) {
                        await Haptics.impact({ style: 'light' });
                    }
                    
                    handleNavigation(isRightSide);
                };

                // スクロールを防止
                const preventScroll = (e) => {
                    e.preventDefault();
                };

                // イベントリスナーの設定
                console.log('Setting up tap events');
                fullscreenView.addEventListener('click', handleTap);
                
                // iOSでのスクロールを防止
                document.addEventListener('touchstart', preventScroll, { passive: false });

                // スタイルの設定
                fullscreenView.style.webkitTapHighlightColor = 'transparent';
                fullscreenView.style.webkitTouchCallout = 'none';
                fullscreenView.style.webkitUserSelect = 'none';
                fullscreenView.style.userSelect = 'none';

                // フルスクリーンの開始
                console.log('Showing fullscreen view');
                fullscreenView.classList.remove('hidden');
                showCurrent();
            }
        }

        // TextEditorのインスタンスを作成
        const editor = new TextEditor();
        console.log('TextEditor initialized');

        // PWAの初期化
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registration successful');
            } catch (err) {
                console.log('ServiceWorker registration failed:', err);
            }
        }
    } catch (error) {
        console.error('Application initialization error:', error);
    }
});