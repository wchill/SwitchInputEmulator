#include <QtGui>
#include <QPixmap>
#include <QLabel>
#include <QImage>
#include <QBrush>
#include <QColor>
#include "controllerui.h"
#include <iostream>

using std::cout;
using std::endl;

ControllerUI::ControllerUI(QWidget *parent) :
    QWidget(parent)
{
    // connect(timer, SIGNAL(timeout()), this, SLOT(update()));
    image = new QImage("/Users/wchill/switch.png");
    resize(parent->width(), parent->height());
}

ControllerUI::~ControllerUI() {
    delete image;
}

void ControllerUI::paintEvent(QPaintEvent *)
{
    QImage scaledImage = image->scaled(this->width(), this->height(), Qt::KeepAspectRatio, Qt::SmoothTransformation);

    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing);
    painter.drawImage((this->width() - scaledImage.width()) / 2, (this->height() - scaledImage.height()) / 2, scaledImage, 0, 0, -1, -1, Qt::NoOpaqueDetection);
    painter.scale(image->width(), image->height());
    painter.setPen(Qt::NoPen);
    /*
    painter.setBrush(QBrush(QColor(255, 0, 0)));
    painter.drawRect(*dpadLeft);
    painter.drawRect(*dpadRight);
    painter.drawRect(*dpadUp);
    painter.drawRect(*dpadDown);
    */
}

QSize ControllerUI::minimumSizeHint() const {
    return QSize(444, 310);
}

QSize ControllerUI::sizeHint() const {
    return QSize(888, 620);
}
