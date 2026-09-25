cmake_minimum_required(VERSION 4.3)
project(n_body_sim)

set(CMAKE_CXX_STANDARD 20)
include_directories(include)
add_executable(n_body_sim main.cpp)
