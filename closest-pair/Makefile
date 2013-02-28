OCL_INC=/usr/include/CL
OCL_LIB=/usr/lib64/

all: main

main: main.o
	g++ -g -L$(OCL_LIB) main.o -o main -lOpenCL

main.o: main.cpp
	g++ -g -std=c++11 -c -I$(OCL_INC) main.cpp -o main.o

clean:
	rm -rf main.o main
