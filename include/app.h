//
// Created by Desktop on 2026/9/25.
//

#ifndef N_BODY_SIM_APP_H
#define N_BODY_SIM_APP_H
#include "minimal.h"

#include <cstdint>
#include <iosfwd>

class n_body_sim_app {
    public:
    n_body_sim_app();
    ~n_body_sim_app() = default;
    void init();
    void tick();
    // 把当前所有物体的位置写成一行 JSON，供 Electron 读取。
    void write_state(std::ostream& out) const;

    private:
    double dt;
    double sim_time_;
    std::uint64_t step_;
    //please edit the template number
    universe<3> universe;
};
#endif //N_BODY_SIM_APP_H
