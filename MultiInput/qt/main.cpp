#include "multiinput.h"
#include "ircresponse.h"
#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication::addLibraryPath(".");
    QApplication a(argc, argv);

    qRegisterMetaType<IrcResponse>();

    MultiInput w;
    w.show();

    return a.exec();
}
