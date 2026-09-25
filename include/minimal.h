//
// Created by Desktop on 2026/9/25.
//

#ifndef N_BODY_SIM_MINIMAL_H
#define N_BODY_SIM_MINIMAL_H

#include <array>
#include <cstdint>

template<std::size_t dimension>
struct vector {
    std::array<float, dimension> data;
    int32_t dim = static_cast<int32_t>(dimension);
    vector(std::array<float ,dimension> list) {
        data = list;
    }
    const float length();



};
#endif //N_BODY_SIM_MINIMAL_H
