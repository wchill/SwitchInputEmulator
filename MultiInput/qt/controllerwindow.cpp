#include <QGridLayout>
#include "controllerwindow.h"
#include "controlleropenglwidget.h"

ControllerWindow::ControllerWindow(std::shared_ptr<ControllerInput> controller, QWidget *parent) :
    QDialog(parent)
{
    setMinimumSize(400, 400);

    setWindowTitle(tr("Controller"));
    ControllerOpenGLWidget *openGL = new ControllerOpenGLWidget(controller, this);

    QGridLayout *layout = new QGridLayout();
    layout->addWidget(openGL, 0, 0);
    layout->setMargin(0);
    layout->setSpacing(0);
    setLayout(layout);
}

/*
QSize ControllerWindow::minimumSizeHint() const {
    return QSize(886, 616);
    //return QSize(888, 620);
}

QSize ControllerWindow::sizeHint() const {
    return QSize(886, 616);
    //return QSize(888, 620);
}

QSize ControllerWindow::maximumSizeHint() const {
    return QSize(886, 616);
    //return QSize(1774, 1238);
}
*/

void ControllerWindow::closeEvent(QCloseEvent *event) {
    emit controllerWindowClosing();
    event->accept();
}
