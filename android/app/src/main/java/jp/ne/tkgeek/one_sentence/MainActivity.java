package jp.ne.tkgeek.one_sentence;

import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebView;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        View decorView = getWindow().getDecorView();
        decorView.setOnApplyWindowInsetsListener((v, insets) -> {
            int navigationBarHeight = insets.getSystemWindowInsetBottom();
            Log.d(TAG, "Navigation bar height: " + navigationBarHeight + "px");
            
            // 実際のデバイスのdpも確認
            float density = getResources().getDisplayMetrics().density;
            float heightInDp = navigationBarHeight / density;
            Log.d(TAG, "Navigation bar height in dp: " + heightInDp + "dp");

            WebView webView = findViewById(com.getcapacitor.android.R.id.webview);
            webView.evaluateJavascript(
                String.format(
                    "console.log('Navigation bar height from Java: %dpx'); " +
                    "document.documentElement.style.setProperty('--nav-bar-height', '%dpx');",
                    navigationBarHeight,
                    navigationBarHeight
                ),
                null
            );
            return insets;
        });
    }
} 