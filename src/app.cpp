//
// Created by Desktop on 2026/9/25.
//
#include "app.h"

#include <iomanip>
#include <limits>
#include <ostream>
#include <utility>

template<std::size_t dimension>
object<dimension>::object(double m, double r)
    : position_{}, velocity_{}, acceleration_{}, net_force_{} {
    radius_ = r;
    mass_ = m;
    volume_ = r*r*r *M_PI* 4/3;
    density_ = mass_/volume_;
}

template<std::size_t dimension>
void object<dimension>::init(vector<dimension> pos, vector<dimension> vel) {
    position_ = pos;
    velocity_ = vel;
}

template<std::size_t N>
universe<N>::universe() {

}

template<std::size_t dimension>
void universe<dimension>::init(std::vector<object<dimension>> initialised_objects) {
    objects_ = initialised_objects;
}

template<std::size_t dimension>
void universe<dimension>::tick(double dt) {
    // 少于两个物体就没有引力对。空容器上的 end()-1 还会落到 begin() 前面。
    if (objects_.size() < 2) {
        return;
    }

    for (auto& body : objects_) {
        body.net_force_ = vector<dimension>{};
    }

    // 外层停在倒数第二个，每对物体只算一次。
    for (auto it = objects_.begin(); it != objects_.end() - 1; ++it) {
        // 内层必须用 it2 判断结束，否则 it2 会一直越过 end()。
        for (auto it2 = it + 1; it2 != objects_.end(); ++it2) {
            // it / it2 是迭代器，用 -> 访问，不能写 objects_[it]。
            const vector<dimension> offset = it2->position_ - it->position_;
            const double distance = offset.length();
            // 两点重合时方向无定义，再除以距离会得到无穷大。
            if (distance == 0.0) {
                continue;
            }
            // |F| = G m1 m2 / r^2，方向是 offset/r，合起来是 G m1 m2 * offset / r^3。
            const double scale = (G * it->mass() * it2->mass()) / (distance * distance * distance);
            const vector<dimension> force = offset * scale;
            it->net_force_ += force;
            it2->net_force_ -= force;
        }
    }

    // 半隐式欧拉：先用 dt 更新速度，再按新速度更新位置。
    for (auto& body : objects_) {
        if (body.mass() == 0.0) {
            continue;
        }
        body.acceleration_ = body.net_force_ * (1.0 / body.mass());
        body.velocity_ += body.acceleration_ * dt;
        body.position_ += body.velocity_ * dt;
    }
}

n_body_sim_app::n_body_sim_app()
    : dt(1.0), sim_time_(0.0), step_(0) {
}

void n_body_sim_app::init() {
    object<3> first(100.0, 0);
    object<3> second(1.0, 1.0);
    first.init(vector<3>(std::array<double, 3>{0.0, 0.0, 0.0}),
               vector<3>(std::array<double, 3>{0.0, 0.0, 0.0}));
    second.init(vector<3>(std::array<double, 3>{1.0, 0.0, 0.0}),
                vector<3>(std::array<double, 3>{0.0, 0.0, 0.0}));
    universe.init({first, second});
}

void n_body_sim_app::tick() {
    universe.tick(dt);
    sim_time_ += dt;
    ++step_;
}

void n_body_sim_app::write_state(std::ostream& out) const {
    const auto precision = std::numeric_limits<double>::max_digits10;
    out << std::setprecision(precision);
    out << "{\"step\":" << step_
        << ",\"time\":" << sim_time_
        << ",\"dt\":" << dt
        << ",\"bodies\":[";
    bool first_body = true;
    for (const auto& body : universe.objects_) {
        if (!first_body) {
            out << ',';
        }
        first_body = false;
        out << "{\"mass\":" << body.mass()
            << ",\"radius\":" << body.radius()
            << ",\"position\":["
            << body.position_.data[0] << ','
            << body.position_.data[1] << ','
            << body.position_.data[2] << "],\"velocity\":["
            << body.velocity_.data[0] << ','
            << body.velocity_.data[1] << ','
            << body.velocity_.data[2] << "]}";
    }
    out << "]}\n";
}
