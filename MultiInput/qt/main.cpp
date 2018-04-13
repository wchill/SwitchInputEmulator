#include "multiinput.h"
#include "ircresponse.h"
#include "controllerconstants.h"
#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication::addLibraryPath(".");
    QApplication a(argc, argv);

    qRegisterMetaType<IrcResponse>();
    qRegisterMetaType<Dpad_t>();
    qRegisterMetaType<Button_t>("Button_t");

    QGamepadManager* manager = QGamepadManager::instance();
    QWindow* window = new QWindow();
    window->show();
    delete window;
    QGuiApplication::processEvents();

    MultiInput w;
    w.show();

    return a.exec();
}
