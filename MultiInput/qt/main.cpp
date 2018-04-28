#include "multiinput.h"
#include "controllerconstants.h"
#include <QApplication>
#include <QSurfaceFormat>
#include <QGamepadManager>

int main(int argc, char *argv[])
{
    QApplication::addLibraryPath(".");
    QApplication::addLibraryPath("~/Qt/5.10.1/gcc_64/lib/");
    QApplication a(argc, argv);

    qRegisterMetaType<Dpad_t>();
    qRegisterMetaType<Button_t>("Button_t");

    QSurfaceFormat format;
    format.setDepthBufferSize(24);
    format.setStencilBufferSize(8);
    format.setVersion(3, 2);
    format.setProfile(QSurfaceFormat::CoreProfile);
    QSurfaceFormat::setDefaultFormat(format);

    QGamepadManager::instance();
    QWindow* window = new QWindow();
    window->show();
    delete window;
    QGuiApplication::processEvents();

    MultiInput w;
    w.show();

    return a.exec();
}
