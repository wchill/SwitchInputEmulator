#include "controllerwindow.h"
#include "ui_controllerwindow.h"
#include "controllerui.h"
#include <iostream>

using std::cout;
using std::endl;

ControllerWindow::ControllerWindow(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::ControllerWindow)
{
    ui->setupUi(this);
    controllerUi = new ControllerUI(this);
    controllerUi->show();
}

ControllerWindow::~ControllerWindow()
{
    delete controllerUi;
    delete ui;
}
