import Foundation
import Capacitor
import UIKit

@objc(FullscreenPlugin)
public class FullscreenPlugin: CAPPlugin {
    private var fullscreenViewController: FullscreenViewController?
    
    @objc func show(_ call: CAPPluginCall) {
        print("FullscreenPlugin: show method called")
        
        guard let texts = call.getArray("texts", String.self), !texts.isEmpty else {
            call.reject("No texts provided or empty texts array")
            return
        }
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                call.reject("Plugin instance is no longer available")
                return
            }
            
            let currentIndex = call.getInt("currentIndex") ?? 0
            print("FullscreenPlugin: Received texts: \(texts)")
            print("FullscreenPlugin: Current index: \(currentIndex)")
            
            // 既存のViewControllerがあれば削除
            if let existingVC = self.fullscreenViewController {
                existingVC.dismiss(animated: false) {
                    self.showNewFullscreen(texts: texts, currentIndex: currentIndex, call: call)
                }
            } else {
                self.showNewFullscreen(texts: texts, currentIndex: currentIndex, call: call)
            }
        }
    }
    
    @objc func hide(_ call: CAPPluginCall) {
        print("FullscreenPlugin: hide method called")
        DispatchQueue.main.async {
            self.fullscreenViewController?.dismiss(animated: true)
            self.fullscreenViewController = nil
            call.resolve()
        }
    }
    
    private func notifyNavigation(isForward: Bool) {
        print("FullscreenPlugin: Notifying navigation event, isForward: \(isForward)")
        notifyListeners("navigationEvent", data: [
            "isForward": isForward
        ])
    }
    
    private func showNewFullscreen(texts: [String], currentIndex: Int, call: CAPPluginCall) {
        print("FullscreenPlugin: Creating new fullscreen view")
        self.fullscreenViewController = FullscreenViewController(texts: texts, initialIndex: currentIndex)
        self.fullscreenViewController?.modalPresentationStyle = .fullScreen
        
        // ナビゲーションのコールバックを設定
        self.fullscreenViewController?.onNavigate = { [weak self] isForward in
            print("FullscreenPlugin: Navigation callback triggered, isForward: \(isForward)")
            self?.notifyNavigation(isForward: isForward)
        }
        
        if let vc = self.fullscreenViewController {
            self.bridge?.viewController?.present(vc, animated: true) {
                call.resolve()
            }
        } else {
            call.reject("Failed to create fullscreen view")
        }
    }
}

class FullscreenViewController: UIViewController {
    private var texts: [String]
    private var currentIndex: Int
    var onNavigate: ((Bool) -> Void)?
    
    private lazy var contentView: UIView = {
        let view = UIView()
        view.backgroundColor = .white
        view.isUserInteractionEnabled = true
        return view
    }()
    
    private lazy var textLabel: UILabel = {
        let label = UILabel()
        label.textAlignment = .center
        label.textColor = .black
        label.numberOfLines = 0
        label.font = .boldSystemFont(ofSize: 48)
        return label
    }()
    
    init(texts: [String], initialIndex: Int = 0) {
        self.texts = texts
        self.currentIndex = initialIndex
        super.init(nibName: nil, bundle: nil)
        modalPresentationStyle = .fullScreen
        isModalInPresentation = true  // これによりスワイプでの解除を防ぐ
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        print("FullscreenViewController: viewDidLoad")
        
        setupUI()
        setupGestureRecognizers()
        showCurrentText()
        
        // ステータスバーを非表示にする
        setNeedsStatusBarAppearanceUpdate()
    }
    
    override var prefersStatusBarHidden: Bool {
        return true
    }
    
    private func setupUI() {
        view.backgroundColor = .white
        
        view.addSubview(contentView)
        contentView.addSubview(textLabel)
        
        contentView.translatesAutoresizingMaskIntoConstraints = false
        textLabel.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            contentView.topAnchor.constraint(equalTo: view.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            textLabel.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            textLabel.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            textLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 20),
            textLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -20)
        ])
    }
    
    private func setupGestureRecognizers() {
        print("FullscreenViewController: Setting up gesture recognizers")
        
        // シンプルなタップジェスチャー
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        tapGesture.cancelsTouchesInView = false
        contentView.addGestureRecognizer(tapGesture)
        
        // 長押しジェスチャー
        let longPressGesture = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress))
        longPressGesture.minimumPressDuration = 1.0
        contentView.addGestureRecognizer(longPressGesture)
    }
    
    @objc private func handleTap(_ gesture: UITapGestureRecognizer) {
        print("Tap detected at index: \(currentIndex)")
        
        if currentIndex < texts.count - 1 {
            // まだ次のテキストがある場合
            currentIndex += 1
            UIView.transition(with: textLabel, duration: 0.3, options: .transitionCrossDissolve) {
                self.showCurrentText()
            }
            onNavigate?(true)
            print("Showing next text: \(currentIndex)")
        } else {
            // 最後のテキストの場合は閉じる
            print("Last text reached, closing")
            dismiss(animated: true)
        }
    }
    
    @objc private func handleLongPress(_ gesture: UILongPressGestureRecognizer) {
        if gesture.state == .began {
            print("Long press detected, closing")
            dismiss(animated: true)
        }
    }
    
    private func showCurrentText() {
        print("Showing text at index: \(currentIndex)")
        textLabel.text = texts[currentIndex]
    }
}

extension FullscreenViewController: UIGestureRecognizerDelegate {
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // システムジェスチャーを無効化
        navigationController?.interactivePopGestureRecognizer?.isEnabled = false
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        // システムジェスチャーを再有効化
        navigationController?.interactivePopGestureRecognizer?.isEnabled = true
    }
    
    // モーダルのスワイプダウンを無効化
    override func presentationControllerDidAttemptToDismiss(_ presentationController: UIPresentationController) {
        // 何もしない（スワイプでの解除を防ぐ）
    }
}