#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// プラグインの実装を定義
CAP_PLUGIN(FullscreenPlugin, "FullscreenPlugin",
    CAP_PLUGIN_METHOD(show, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(hide, CAPPluginReturnPromise);
)