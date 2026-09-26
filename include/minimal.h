//
// Created by Desktop on 2026/9/25.
//

#ifndef N_BODY_SIM_MINIMAL_H
#define N_BODY_SIM_MINIMAL_H

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif


#ifndef G
#define G 6.67430e-11
#endif

#include <array>
#include <cmath>
#include <cstdint>
#include <cmath>
#include <vector>


template<std::size_t dimension>
struct vector {
    //array that stores the data of the vector
    std::array<double, dimension> data;
    //number of dimension
    int32_t dim = static_cast<int32_t>(dimension);
    explicit vector(std::array<double ,dimension> list) {
        data = list;
    }
    explicit vector() = default;

    ~vector() = default;
    [[nodiscard]] double length() const;

    //vector addition and subtraction
    vector& operator+=(const vector &a) {
        for (std::size_t i = 0; i < dimension; ++i) {
            data[i] += a.data[i];
        }
        return *this;
    }
    vector& operator-=(const vector &a) {
        for (std::size_t i = 0; i < dimension; ++i) {
            data[i] -= a.data[i];
        }
        return *this;
    }
    vector operator+(const vector &a) const {
        vector result(*this);
        result += a;
        return result;
    }
    vector operator-(const vector &a) const {
        vector result(*this);
        result -= a;
        return result;
    }

    //scarlar multiplication
    vector& operator*=(double a) {
        for (auto& e: this -> data) {
            e *= a;
        }
        return *this;
    }
    vector operator*(double a) const {
        vector result(*this);
        for (auto& e: result.data) {
            e *= a;
        }
        return result;
    }

    //component-wise vector multiplication
    vector& operator*=(const vector &a) {
        for (std::size_t i = 0; i < dimension; ++i) {
            data[i] *= a.data[i];
        }
        return *this;
    }
    vector operator*(const vector &a) const {
        vector result(*this);
        result *= a;
        return result;
    }

    //scalar dividance
    vector& operator/=(double a) {
        for (auto& e: this -> data) {
            e /= a;
        }
        return *this;
    }
    vector operator/(double a) const {
        vector result(*this);
        result /= a;
        return result;
    }

};

// Inner product only. length() takes the square root once.
template<std::size_t dimension>
double dot(const vector<dimension> &a, const vector<dimension> &b) {
    double result = 0;
    for (std::size_t i = 0; i < dimension; ++i) {
        result += a.data[i] * b.data[i];
    }
    return result;
}

//euclidean norm of vectors, this can be modified if user want to test other spaces
template<std::size_t dimension>
double vector<dimension>::length() const {
    return std::sqrt(dot(*this, *this));
}

//in this project, we will assume all object are balls, so that the cog lies on the center perfectly
template<std::size_t dimension>
class object {
public:
    object(double m, double r);
    ~object() = default;

    void init(vector<dimension> pos, vector<dimension>vel);
    [[nodiscard]] inline double mass() const{return mass_;}
    [[nodiscard]] inline double radius() const{return radius_;}
    [[nodiscard]] inline double volume() const{return volume_;}
    [[nodiscard]] inline double density() const{return density_;}

    vector<dimension> position_;
    vector<dimension> velocity_;
    vector<dimension> acceleration_;
    vector<dimension> net_force_;

    private:
    double mass_;
    double radius_;
    double density_;
    double volume_;

};


template<std::size_t dimension>
class universe {
public:
    universe();
    ~universe() = default;

    void init(std::vector<object<dimension>> initialised_objects);
    void tick(double dt);
    std::vector<object<dimension>> objects_;

};
#endif //N_BODY_SIM_MINIMAL_H
