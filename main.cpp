#include "app.h"

#include <chrono>
#include <iostream>
#include <thread>

int main() {
    n_body_sim_app app{};
    app.init();
    // G 是国际单位制里的真实常数，单步 1 秒时位移极小。
    // 每一帧推进 100 步，窗口里的坐标才会在几秒内看出变化。
    constexpr int steps_per_frame = 100;
    while (true) {
        const auto frame_start = std::chrono::steady_clock::now();
        for (int i = 0; i < steps_per_frame; ++i) {
            app.tick();
        }
        app.write_state(std::cout);
        std::cout.flush();
        constexpr auto frame = std::chrono::milliseconds(33);
        const auto elapsed = std::chrono::steady_clock::now() - frame_start;
        if (elapsed < frame) {
            std::this_thread::sleep_for(frame - elapsed);
        }
    }
}