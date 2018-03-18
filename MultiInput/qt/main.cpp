#include "multiinput.h"
#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication::addLibraryPath(".");
    QApplication a(argc, argv);
    MultiInput w;
    w.show();

    return a.exec();
}
