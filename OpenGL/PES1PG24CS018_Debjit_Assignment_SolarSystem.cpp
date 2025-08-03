#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h" // Include the stb_image library for loading textures

#include <stdio.h>
#include <stdlib.h>
#include <glut.h>
#include <math.h>
#include <time.h> // For srand() and time()

#define PI 3.1415926535

// Global texture IDs
GLuint texture_sun, texture_mercury, texture_venus, texture_earth, /*texture_moon,*/ // Moon texture removed
texture_mars, texture_jupiter, texture_saturn, texture_uranus, texture_neptune;

// Static variables for planet rotations and other animations (now floats for smooth speed control)
static float m = 0, M = 0, v = 0, V = 0, E = 0, e = 0, r = 0, R = 0, j = 0, J = 0,
s = 0, S = 0, U = 0, u = 0, n = 0, N = 0, X = 0, z = 0;

// View state, zoom, animation and meteor control variables
static int view_state = 0;      // 0: default, 1: top view, 2: perspective view
static float zoom = 25.0f;      // Camera zoom level
static int animate = 1;         // Flag to start/stop overall animation
static float animationSpeed = 0.2f; // Controls the overall speed of the simulation

// Meteor shower control variables
static float meteorX = 25.0f, meteorY = 25.0f; // Meteor starting position
static int meteorActive = 0;      // Flag to activate/deactivate meteor shower
static float meteorSpeed = 0.1f;  // Speed of the meteor shower

// Function to load a texture from a file
GLuint loadTexture(const char* path) {
    GLuint textureID;
    glGenTextures(1, &textureID);
    glBindTexture(GL_TEXTURE_2D, textureID);

    int width, height, nrChannels;
    unsigned char* data = stbi_load(path, &width, &height, &nrChannels, 0);
    if (data) {
        GLenum format = GL_RGB;
        if (nrChannels == 1) format = GL_RED;
        else if (nrChannels == 3) format = GL_RGB;
        else if (nrChannels == 4) format = GL_RGBA;
        gluBuild2DMipmaps(GL_TEXTURE_2D, format, width, height, format, GL_UNSIGNED_BYTE, data);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    }
    else {
        fprintf(stderr, "Failed to load texture: %s\n", path);
        glDeleteTextures(1, &textureID);
        textureID = 0;
    }
    stbi_image_free(data);
    return textureID;
}

// Function to draw a textured sphere
void drawTexturedSphere(GLfloat radius, GLint slices, GLint stacks, GLuint textureID) {
    GLUquadricObj* quadric = gluNewQuadric();
    gluQuadricNormals(quadric, GLU_SMOOTH);
    if (textureID != 0) {
        gluQuadricTexture(quadric, GL_TRUE);
        glBindTexture(GL_TEXTURE_2D, textureID);
        glEnable(GL_TEXTURE_2D);
    }
    else {
        glDisable(GL_TEXTURE_2D);
        glColor3f(0.5f, 0.5f, 0.5f);
    }
    gluSphere(quadric, radius, slices, stacks);
    gluDeleteQuadric(quadric);
    if (textureID == 0) {
        glEnable(GL_TEXTURE_2D);
    }
}

// Function to draw a circular orbit (orbits are not physical objects, so they remain unlit)
void drawOrbit(float radius) {
    glPushMatrix();
    glColor3f(0.3f, 0.3f, 0.3f);
    glDisable(GL_LIGHTING); // Orbits are guidelines, not affected by light
    glBegin(GL_LINE_LOOP);
    for (int i = 0; i < 360; i++) {
        float angle = i * PI / 180.0;
        glVertex3f(radius * cos(angle), 0.0, radius * sin(angle));
    }
    glEnd();
    glEnable(GL_LIGHTING); // Re-enable lighting for physical objects
    glPopMatrix();
}

// Function to draw the shooting star/meteor (self-illuminated)
void drawMeteor() {
    glPushMatrix();
    glDisable(GL_LIGHTING); // Meteor is bright, not affected by Sun light
    glColor3f(1.0f, 1.0f, 0.8f);
    glTranslatef(meteorX, meteorY, 0.0f);
    glutSolidSphere(0.1, 10, 10);
    glColor3f(0.8f, 0.8f, 0.7f);
    glutSolidSphere(0.07, 8, 8);
    glTranslatef(0.1f, 0.1f, 0.0f);
    glutSolidSphere(0.04, 6, 6);
    glEnable(GL_LIGHTING); // Re-enable lighting for other objects
    glPopMatrix();
}

// Function to render a string using bitmap fonts
void drawLabel(const char* text) {
    void* font = GLUT_BITMAP_HELVETICA_12;
    for (const char* c = text; *c != '\0'; c++) {
        glutBitmapCharacter(font, *c);
    }
}

/* initialize material property, light source, lighting model, and depth buffer */
void myinit(void) {
    glClearColor(0.0, 0.0, 0.0, 0.0);
    glShadeModel(GL_SMOOTH);
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_TEXTURE_2D);
    glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
    GLfloat light0_position[] = { 0.0, 0.0, 0.0, 1.0 };
    GLfloat light0_diffuse[] = { 1.0, 1.0, 1.0, 1.0 };
    GLfloat light0_specular[] = { 1.0, 1.0, 1.0, 1.0 };
    GLfloat light0_ambient[] = { 0.005, 0.005, 0.005, 1.0 };
    glLightfv(GL_LIGHT0, GL_POSITION, light0_position);
    glLightfv(GL_LIGHT0, GL_DIFFUSE, light0_diffuse);
    glLightfv(GL_LIGHT0, GL_SPECULAR, light0_specular);
    glLightfv(GL_LIGHT0, GL_AMBIENT, light0_ambient);
    glEnable(GL_LIGHT0);
    GLfloat light1_ambient[] = { 0.03, 0.03, 0.03, 1.0 };
    glLightModelfv(GL_LIGHT_MODEL_AMBIENT, light1_ambient);
    glEnable(GL_LIGHTING); // Lighting is enabled globally
    GLfloat mat_ambient[] = { 0.1, 0.1, 0.1, 1.0 };
    GLfloat mat_diffuse[] = { 0.8, 0.8, 0.8, 1.0 };
    GLfloat mat_specular[] = { 1.0, 1.0, 1.0, 1.0 };
    GLfloat mat_shininess[] = { 50.0 };
    glMaterialfv(GL_FRONT, GL_AMBIENT, mat_ambient);
    glMaterialfv(GL_FRONT, GL_DIFFUSE, mat_diffuse);
    glMaterialfv(GL_FRONT, GL_SPECULAR, mat_specular);
    glMaterialfv(GL_FRONT, GL_SHININESS, mat_shininess);
    glEnable(GL_COLOR_MATERIAL);
    glColorMaterial(GL_FRONT_AND_BACK, GL_AMBIENT_AND_DIFFUSE);
    texture_sun = loadTexture("8k_sun.jpg");
    texture_mercury = loadTexture("8k_mercury.jpg");
    texture_venus = loadTexture("8k_venus_surface.jpg");
    texture_earth = loadTexture("8k_earth_daymap.jpg");
    texture_mars = loadTexture("8k_mars.jpg");
    texture_jupiter = loadTexture("8k_jupiter.jpg");
    texture_saturn = loadTexture("8k_saturn.jpg");
    texture_uranus = loadTexture("2k_uranus.jpg");
    texture_neptune = loadTexture("2k_neptune.jpg");
}

void setView(void) {
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    switch (view_state) {
    case 0: gluLookAt(0.0, 5.0, zoom, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0); break;
    case 1: gluLookAt(0.0, zoom, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0); break;
    case 2: gluLookAt(zoom / 1.5, zoom / 1.5, zoom / 1.5, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0); break;
    }
}

void display(void) {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    setView();

    if (meteorActive) {
        drawMeteor();
    }

    // Draw the Sun
    glPushMatrix();
    glRotatef((GLfloat)z, 0.0, 1.0, 0.0);
    glDisable(GL_LIGHTING); // Disable lighting for the Sun SPHERE only, as it is the source
    drawTexturedSphere(1.0, 40, 16, texture_sun);
    glEnable(GL_LIGHTING);  // Re-enable lighting for all other objects, including the Sun's label
    // The Sun's label will be lit. Since it's at the center of the light, it will be bright.
    glColor3f(1.0f, 1.0f, 1.0f);
    glRasterPos3f(0.0f, 1.3f, 0.0f);
    drawLabel("Sun");
    glPopMatrix();

    // --- Draw all planetary orbits ---
    drawOrbit(2.0f * 1.5f); drawOrbit(3.5f * 1.5f); drawOrbit(5.0f * 1.5f);
    drawOrbit(6.5f * 1.5f); drawOrbit(9.0f * 1.5f); drawOrbit(11.5f * 1.5f);
    drawOrbit(14.0f * 1.5f); drawOrbit(16.5f * 1.5f);

    // --- Draw all planets with textures and LIT labels ---
    // The glColor3f call before a label now sets its material property for lighting.

    // Mercury
    glPushMatrix();
    glRotatef((GLfloat)M, 0.0, 1.0, 0.0);
    glTranslatef(2.0 * 1.5f, 0.0, 0.0);
    glPushMatrix();
    glRotatef((GLfloat)m, 0.0, 1.0, 0.0);
    drawTexturedSphere(0.15, 20, 8, texture_mercury);
    glPopMatrix();
    glColor3f(1.0f, 1.0f, 1.0f);
    glRasterPos3f(0.0f, 0.3f, 0.0f);
    drawLabel("Mercury");
    glPopMatrix();

    // Venus
    glPushMatrix();
    glRotatef((GLfloat)V, 0.0, 1.0, 0.0);
    glTranslatef(3.5 * 1.5f, 0.0, 0.0);
    glPushMatrix();
    glRotatef((GLfloat)v, 0.0, 1.0, 0.0);
    drawTexturedSphere(0.3, 20, 8, texture_venus);
    glPopMatrix();
    glColor3f(1.0f, 1.0f, 1.0f);
    glRasterPos3f(0.0f, 0.45f, 0.0f);
    drawLabel("Venus");
    glPopMatrix();

    // Earth
    glPushMatrix();
    glRotatef((GLfloat)E, 0.0, 1.0, 0.0);
    glTranslatef(5.0 * 1.5f, 0.0, 0.0);
    glPushMatrix();
    glRotatef((GLfloat)e, 0.0, 1.0, 0.0);
    drawTexturedSphere(0.4, 20, 8, texture_earth);
    glPopMatrix();
    glColor3f(1.0f, 1.0f, 1.0f);
    glRasterPos3f(0.0f, 0.55f, 0.0f);
    drawLabel("Earth");
    glPopMatrix();

    // Mars
    glPushMatrix();
    glRotatef((GLfloat)R, 0.0, 1.0, 0.0);
    glTranslatef(6.5 * 1.5f, 0.0, 0.0);
    glPushMatrix();
    glRotatef((GLfloat)r, 0.0, 1.0, 0.0);
    drawTexturedSphere(0.2, 20, 8, texture_mars);
    glPopMatrix();
    glColor3f(1.0f, 1.0f, 1.0f);
    glRasterPos3f(0.0f, 0.35f, 0.0f);
    drawLabel("Mars");
    glPopMatrix();

    // Jupiter
    glPushMatrix();
    glRotatef((GLfloat)J, 0.0, 1.0, 0.0);
    glTranslatef(9.0 * 1.5f, 0.0, 0.0);
    glPushMatrix();
    glRotatef((GLfloat)j, 0.0, 1.0, 0.0);
    drawTexturedSphere(1.0, 20, 8, texture_jupiter);
    glPopMatrix();
    glColor3f(1.0f, 1.0f, 1.0f);
    glRasterPos3f(0.0f, 1.2f, 0.0f);
    drawLabel("Jupiter");
    glPopMatrix();

    // Saturn and its rings (rings are now also lit)
    glPushMatrix();
    glRotatef((GLfloat)S, 0.0, 1.0, 0.0);
    glTranslatef(11.5 * 1.5f, 0.0, 0.0);
    glRotatef(25.0f, 1.0, 0.0, 0.0);
    glPushMatrix();
    glRotatef((GLfloat)s, 0.0, 0.0, 1.0);
    drawTexturedSphere(0.9, 20, 16, texture_saturn);
    glPopMatrix();
    // Draw lit rings
    glColor3f(0.7f, 0.6f, 0.4f);
    glBegin(GL_QUAD_STRIP);
    for (int i = 0; i <= 360; i++) {
        float angle = i * PI / 180.0;
        glVertex3f(sin(angle) * 0.8 * 1.5f, cos(angle) * 0.8 * 1.5f, 0);
        glVertex3f(sin(angle) * 1.2 * 1.5f, cos(angle) * 1.2 * 1.5f, 0);
    }
    glEnd();
    // Draw lit label
    glColor3f(1.0f, 1.0f, 1.0f);
    glRasterPos3f(0.0f, 2.0f, 0.0f);
    drawLabel("Saturn");
    glPopMatrix();

    // Uranus
    glPushMatrix();
    glRotatef((GLfloat)U, 0.0, 1.0, 0.0);
    glTranslatef(14.0 * 1.5f, 0.0, 0.0);
    glPushMatrix();
    glRotatef((GLfloat)u, 1.0, 0.0, 0.0);
    drawTexturedSphere(0.7, 20, 16, texture_uranus);
    glPopMatrix();
    glColor3f(1.0f, 1.0f, 1.0f);
    glRasterPos3f(0.0f, 0.9f, 0.0f);
    drawLabel("Uranus");
    glPopMatrix();

    // Neptune
    glPushMatrix();
    glRotatef((GLfloat)N, 0.0, 1.0, 0.0);
    glTranslatef(16.5 * 1.5f, 0.0, 0.0);
    glPushMatrix();
    glRotatef((GLfloat)n, 0.0, 1.0, 0.0);
    drawTexturedSphere(0.6, 20, 8, texture_neptune);
    glPopMatrix();
    glColor3f(1.0f, 1.0f, 1.0f);
    glRasterPos3f(0.0f, 0.8f, 0.0f);
    drawLabel("Neptune");
    glPopMatrix();

    glutSwapBuffers();
}

void reshape(int w, int h) {
    glViewport(0, 0, (GLsizei)w, (GLsizei)h);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluPerspective(60.0, (GLfloat)w / (GLfloat)h, 1.0, 100.0);
    glMatrixMode(GL_MODELVIEW);
}

void idle(void) {
    if (animate) {
        M = fmod(M + 0.6f * animationSpeed, 360.0f);
        V = fmod(V + 0.2f * animationSpeed, 360.0f);
        E = fmod(E + 0.1f * animationSpeed, 360.0f);
        R = fmod(R + 0.06f * animationSpeed, 360.0f);
        J = fmod(J + 0.02f * animationSpeed, 360.0f);
        S = fmod(S + 0.008f * animationSpeed, 360.0f);
        U = fmod(U + 0.003f * animationSpeed, 360.0f);
        N = fmod(N + 0.001f * animationSpeed, 360.0f);
        m = fmod(m + 2.0f * animationSpeed, 360.0f);
        v = fmod(v + 1.5f * animationSpeed, 360.0f);
        e = fmod(e + 15.0f * animationSpeed, 360.0f);
        r = fmod(r + 14.0f * animationSpeed, 360.0f);
        j = fmod(j + 30.0f * animationSpeed, 360.0f);
        s = fmod(s + 28.0f * animationSpeed, 360.0f);
        u = fmod(u + 20.0f * animationSpeed, 360.0f);
        n = fmod(n + 18.0f * animationSpeed, 360.0f);
        z = fmod(z + 0.5f * animationSpeed, 360.0f);
    }
    if (meteorActive) {
        meteorX -= meteorSpeed;
        meteorY -= meteorSpeed;
        if (meteorX < -25.0f || meteorY < -25.0f) {
            meteorX = 25.0f + (rand() % 10);
            meteorY = 25.0f + (rand() % 10);
        }
    }
    glutPostRedisplay();
}

void keyboard(unsigned char key, int x, int y) {
    switch (key) {
    case 'b': case 'B': animate = !animate; break;
    case 'm': case 'M':
        meteorActive = !meteorActive;
        if (meteorActive) {
            meteorX = 25.0f + (rand() % 10);
            meteorY = 25.0f + (rand() % 10);
        }
        break;
    case '2': animationSpeed += 0.05f; break;
    case '1': animationSpeed -= 0.05f; if (animationSpeed < 0.0f) animationSpeed = 0.0f; break;
    case '+': zoom -= 0.5f; if (zoom < 5.0f) zoom = 5.0f; break;
    case '-': zoom += 0.5f; if (zoom > 50.0f) zoom = 50.0f; break;
    case 27: exit(0); break;
    }
    glutPostRedisplay();
}

void mouse(int btn, int state, int x, int y) {
    if (btn == GLUT_LEFT_BUTTON && state == GLUT_DOWN) {
        view_state = (view_state + 1) % 3;
        glutPostRedisplay();
    }
    if (btn == GLUT_RIGHT_BUTTON && state == GLUT_DOWN) {
        animate = !animate;
        glutPostRedisplay();
    }
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayString("rgba double depth");
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GL_DEPTH);
    glutInitWindowSize(1024, 768);
    glutInitWindowPosition(100, 100);
    glutCreateWindow("Realistic Solar System with Lit Labels");
    srand(time(NULL));
    M = rand() % 360; V = rand() % 360; E = rand() % 360; R = rand() % 360;
    J = rand() % 360; S = rand() % 360; U = rand() % 360; N = rand() % 360;
    myinit();
    glutDisplayFunc(display);
    glutReshapeFunc(reshape);
    glutKeyboardFunc(keyboard);
    glutMouseFunc(mouse);
    glutIdleFunc(idle);
    glutMainLoop();
    return 0;
}