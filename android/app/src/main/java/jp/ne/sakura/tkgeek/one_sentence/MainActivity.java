package jp.ne.tkgeek.one_sentence;

import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        View decorView = getWindow().getDecorView();
        decorView.setOnApplyWindowInsetsListener((v, insets) -> {
            int navigationBarHeight = insets.getSystemWindowInsetBottom();
            
            WebView webView = findViewById(com.getcapacitor.android.R.id.webview);
            webView.evaluateJavascript(
                String.format(
                    "document.documentElement.style.setProperty('--nav-bar-height', '%dpx');",
                    navigationBarHeight
                ),
                null
            );
            return insets;
        });
    }
}