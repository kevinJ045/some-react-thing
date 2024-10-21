import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { randInt } from 'three/src/math/MathUtils.js';

const Laptop = ({ currentPage, onClick }) => {
    const laptopRef = useRef();
    const [openState, setOpenState] = useState(false);
    const [screenMaterial, setScreenMaterial] = useState(null);
    const [animationMixer, setAnimationMixer] = useState(null);

    const updateFunction = useRef();
    const canvasRef = useRef();
    const contextRef = useRef();
    const canvasTexture = useRef();
    const events = useRef();
    
    // Load the GLTF model
    const { nodes, animations } = useLoader(GLTFLoader, '/laptop-mini-quality-open-close.glb');

    const findAnimation = (animationName) => {
        return animations.find(a => a.name == animationName);
    }

    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;

        events.current = {
            _events: [],
            removeAll: () => {
                events.current._events.forEach(({ event, callback }) => {
                    document.removeEventListener(event, callback);
                });
            },
            on: (event, callback) => {
                document.addEventListener(event, callback);
                events.current._events.push({ event, callback });
            }
        };

        // document.addEventListener('keydown', (event) => {
        //     if(!events.current.keys.includes(event.key)) events.current.keys.push(event.key);
        //     events.current.key = event.key;
        // });
        // document.addEventListener('keyup', (event) => {
        //     let found = events.current.keys.indexOf(event.key);
        //     events.current.keys = events.current.keys.filter(e => e !== event.key);
        //     events.current.key = null;
        // });

        const context = canvas.getContext('2d');
        canvasRef.current = canvas;
        contextRef.current = context;
        canvasTexture.current = (new THREE.Texture(canvas));
    }, []);

    useEffect(() => {

        const canvas = canvasRef.current;
        const context = contextRef.current;
        let states = {};

        // Draw on the canvas based on the current page
        const drawContent = () => {
            updateFunction.current = (null);
            events.current.removeAll();
            states = {};

            context.clearRect(0, 0, canvas.width, canvas.height);
            // Call the appropriate function for the current page
            const pageContent = pageData[currentPage];
            if (pageContent && pageContent.screen) {
                let repeating = pageContent.screen(context, false, 0, states, events.current);
                if(repeating === true) updateFunction.current = (delta) => {
                    pageContent.screen(context, true, delta, states, events.current);
                    canvasTexture.current.needsUpdate = true;
                    nodes.Laptop.children[6].material.needsUpdate = true;
                };
                else {
                    updateFunction.current = (null);
                    events.current.removeAll();
                }
            }
            nodes.Laptop.children[6].material.needsUpdate = true;
            canvasTexture.current.needsUpdate = true;
        };

        if(canvas && context) drawContent();

        // Set up animation mixer
    }, [currentPage]);

    useEffect(() => {
        // Update the screen material with the canvas texture
        if (nodes.Laptop && nodes.Laptop.children) {
            const screenMat = new THREE.MeshStandardMaterial();
            if (screenMat) {
                screenMat.map = canvasTexture.current || new THREE.Texture(canvasRef.current);
                screenMat.map.wrapS = THREE.RepeatWrapping;
                screenMat.map.wrapT = THREE.RepeatWrapping;
                screenMat.map.rotation = -Math.PI / 2;
                screenMat.map.repeat.set(1, -1);
                setScreenMaterial(screenMat);
                screenMat.needsUpdate = true; // Ensure the material is updated
            }
            nodes.Laptop.children[6].material = screenMat;
        }
    }, [canvasTexture, nodes]);

    useEffect(() => {
        // const mixer = new THREE.AnimationMixer(laptopRef.current);
        // setAnimationMixer(mixer);
        
        // // Handle animation
        // if (animations.length) {
        //     const action = mixer.clipAction(findAnimation('LidOpening')); // Assuming first animation is for opening/closing
        //     action.play();
        // }

        // return () => {
        //     if (mixer) mixer.stopAllAction();
        // };
    }, [laptopRef]);

    // Handle open/close state change
    const toggleLid = () => {
        if (openState) {
            // Close the lid
            setOpenState(false);
            // animationMixer.clipAction(findAnimation("OpenLid")).play(); // Assuming CloseLid is the second animation
        } else {
            // Open the lid
            setOpenState(true);
            // animationMixer.clipAction(findAnimation("CloseLid")).play(); // Assuming OpenLid is the third animation
        }
        onClick();
    };

    // Update the animation mixer on each frame
    useFrame((state, delta) => {
        if (animationMixer) animationMixer.update(delta);
        if (typeof updateFunction.current == "function") {
            updateFunction.current(delta);
        }
    });

    return (
        <group ref={laptopRef} onClick={toggleLid}>
            <primitive object={nodes.Laptop} />
        </group>
    );
};

const pageData = [
    {
        pageId: 0,
        screen: (ctx) => {
            ctx.fillStyle = 'blue'; // Example content for page 0
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.fillStyle = 'white';
            ctx.font = '100px Consolas';
            ctx.fillText(':(', 50, 100);
            ctx.font = '20px Consolas';
            
            // BSOD Message
            const bsodText = `
            Your PC ran into a problem and needs to restart.
            We're just collecting some error info, and then we'll restart for you.

            For more information about this issue and possible fixes, visit www.windows.com
            If you call a support person, give them this info:
            Stop Code: CRITICAL_PROCESS_DIED`;

            // Draw the text line by line
            const lines = bsodText.split('\n');
            let y = 200; // Starting Y position
            lines.forEach(line => {
                ctx.fillText(line.trim(), 50, y);
                y += 30; // Line height
            });
        },
        content: () => <div>Page 0 Content</div>,
        title: "Page 0",
    },
    {
        pageId: 1,
        screen: (ctx, isUpdate, delta, states) => {
            // Set canvas dimensions
            const canvasWidth = ctx.canvas.width;
            const canvasHeight = ctx.canvas.height;
            
            // Fill the background with black
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
            // If it's the initial render, setup states
            if (!isUpdate) {
                // Set initial states for loading circle and logo
                states.rotation = 0; // Rotation angle for the loading circle
                states.logoRadius = 20; // Radius of the loading circle
                states.dotRadius = 2; // Radius of the dots in the loading circle
                states.numDots = 10; // Number of dots in the loading circle
                states.centerX = canvasWidth / 2; // Center X coordinate
                states.centerY = canvasHeight / 5; // Center Y coordinate for the Windows logo
                states.loadingCenterY = canvasHeight / 2.5; // Y position for the loading circle
                states.logoColor = '#00a4ef'; // Windows logo color
            } else {
                // Update the rotation of the loading circle using the delta time
                states.rotation += 0.05; // Adjust speed by tweaking the multiplier
            }
    
            // Draw the Windows logo
            const spacing = canvasWidth * 0.01;
            const rectWidth = 40;  // Width of each rectangle in the Windows logo
            const rectHeight = 40; // Height of each rectangle in the Windows logo
    
            // First top-left rectangle
            ctx.fillStyle = states.logoColor;
            ctx.fillRect(states.centerX - rectWidth - spacing / 2, states.centerY - rectHeight - spacing / 2, rectWidth, rectHeight);
    
            // Top-right rectangle
            ctx.fillRect(states.centerX + spacing / 2, states.centerY - rectHeight - spacing / 2, rectWidth, rectHeight);
    
            // Bottom-left rectangle
            ctx.fillRect(states.centerX - rectWidth - spacing / 2, states.centerY + spacing / 2, rectWidth, rectHeight);
    
            // Bottom-right rectangle
            ctx.fillRect(states.centerX + spacing / 2, states.centerY + spacing / 2, rectWidth, rectHeight);
    
            // Draw the loading circle (rotating dots)
            ctx.save(); // Save the current drawing state
            ctx.translate(states.centerX, states.loadingCenterY); // Move the context to the loading circle's center
    
            for (let i = 0; i < states.numDots; i++) {
                const angle = (i / states.numDots) * Math.PI * 2; // Calculate the angle for each dot
                const x = Math.cos(angle + states.rotation) * states.logoRadius; // X position of the dot
                const y = Math.sin(angle + states.rotation) * states.logoRadius; // Y position of the dot
    
                // Draw each dot
                ctx.beginPath();
                ctx.arc(x, y, states.dotRadius, 0, Math.PI * 2);
                ctx.fillStyle = i == states.numDots - 1 ? 'black' : 'white'; // Dot color
                ctx.fill();
            }
    
            ctx.restore(); // Restore the context state
    
            return true;
        },
        content: () => <div>Page 1 Content</div>,
        title: "Page 1",
    },
    {
        pageId: 2,
        screen: (ctx, isUpdate, delta, states) => {
            // Set canvas dimensions
            const canvasWidth = ctx.canvas.width;
            const canvasHeight = ctx.canvas.height;
    
            // Fill the background with black
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
            // If it's the initial render, setup states
            if (!isUpdate) {
                states.textY = canvasHeight * 0.3; // Starting Y position for the text
                states.lineHeight = 20; // Height between lines of text
                states.messages = [
                    'Booting Linux...',
                    'Initializing system...',
                    'Mounting filesystems...',
                    'Checking disk...',
                    'Starting services...',
                    'Loading kernel modules...',
                    'Configuring network...',
                    'Starting login services...',
                    'Linux boot completed.',
                    'Welcome to your Linux system!',
                ];
                states.currentMessage = 0; // Index of the current message to display
                states.lastUpdate = 0; // Time of the last update
            } else {
                // Update the message display rate
                states.lastUpdate += 1;
                if (states.lastUpdate > 10) { // Change message every 500 milliseconds
                    states.currentMessage = (states.currentMessage + 1) % states.messages.length;
                    states.lastUpdate = 0; // Reset last update time
                }
            }
    
            // Draw the messages
            ctx.fillStyle = 'white'; // Text color
            ctx.font = '16px monospace'; // Monospace font for terminal look
    
            for (let i = 0; i < states.messages.length; i++) {
                ctx.fillText(states.messages[i], canvasWidth * 0.1, states.textY + i * states.lineHeight);
            }
    
            // Highlight the current message
            ctx.fillStyle = '#00FF00'; // Green color for the current message
            ctx.fillText(states.messages[states.currentMessage], canvasWidth * 0.1, states.textY + states.currentMessage * states.lineHeight);
    
            return true;
        },
        content: () => <div>Page 2 Content</div>,
        title: "Linux Boot Screen",
    },
    {
        pageId: 4,
        screen: (ctx, isUpdate, delta, states, events) => {
            // Set canvas dimensions
            const canvasWidth = ctx.canvas.width;
            const canvasHeight = ctx.canvas.height;
    
            // Fill the background with black
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // If it's the initial render, setup states
            if (!isUpdate) {
                states.textY = canvasHeight * 0.1; // Starting Y position for the text
                states.lineHeight = 24; // Height between lines of text
                states.history = []; // Command history
                states.currentInput = ''; // Current user input
                states.prompt = '$ '; // Command prompt

                events.on('keydown', (event) => {
                    event.preventDefault();
                    const key = event.key;
                    if (key === 'Enter') {
                        // Execute command and reset input
                        const command = states.currentInput.trim();
                        const folders = [
                            "bin  boot dev etc",
                            "home lib  opt temp",
                            "root run  sys proc",
                            "usr  var"
                        ];
                        if (command) {
                            states.history.push(states.prompt + command);
                            // Simulate command output
                            if (command === 'help') {
                                states.history.push('Available commands: help, clear, ls, echo <message>');
                            } else if (command === 'clear') {
                                states.history = []; // Clear the terminal
                            } else if (command.startsWith('echo ')) {
                                const message = command.slice(5);
                                states.history.push(message);
                            } else if (command.startsWith('bash')) {
                            } else if (command.startsWith('ls')) {
                                const message = command.slice(2);
                                if(message && message.trim() !== '/') states.history.push(folders.join(' ').match(message.trim()) ? `"${message.trim()}": Permission denied (os error 13)` : `"${message.trim()}": No such file or directory (os error 2)`);
                                else states.history.push(...folders);
                            } else {
                                states.history.push(`bash: ${command}: command not found`);
                            }
                        }
                        states.currentInput = ''; // Clear input after executing command
                    } else if (key === 'Backspace') {
                        // Remove last character
                        states.currentInput = states.currentInput.slice(0, -1);
                    } else if (key?.length === 1) {
                        // Add character to input
                        states.currentInput += key;
                    }
                });
                
            }

    
            // Draw the prompt and user input
            ctx.fillStyle = 'green'; // Text color
            ctx.font = '20px monospace'; // Monospace font for terminal look
            
            // Display command history
            for (let i = 0; i < states.history.length; i++) {
                ctx.fillText(states.history[i], canvasWidth * 0.1, states.textY + i * states.lineHeight);
            }
    
            // Draw the prompt
            ctx.fillText(states.prompt + states.currentInput, canvasWidth * 0.1, states.textY + states.history.length * states.lineHeight);

            const cursorX = canvasWidth * 0.1 + ctx.measureText(states.prompt + states.currentInput).width; // X position for the cursor
            const cursorY = states.textY + states.history.length * states.lineHeight - 20; // Adjust cursor Y position
            ctx.fillRect(cursorX, cursorY, 2, 20); // Draw a vertical line as the cursor

            return true;
        },
        content: () => {
            return <div>Page 4 Content</div>;
        },
        title: "Linux-like Terminal",
    },
    {
        pageId: 5,
        screen: (ctx, isUpdate, delta, states) => {
            // Set canvas dimensions
            const canvasWidth = ctx.canvas.width;
            const canvasHeight = ctx.canvas.height;

            const drawTerminal = () => {
                const terminalWidth = canvasWidth * 0.2;
                const terminalHeight = canvasHeight * 0.2;
                const terminalX = (canvasWidth - terminalWidth) / 10;
                const terminalY = (canvasHeight - terminalHeight) * 0.1;

    
                // Draw terminal background
                ctx.fillStyle = '#11111b';
                ctx.fillRect(terminalX, terminalY, terminalWidth, terminalHeight);

                // Draw close, minimize, and maximize buttons
                ctx.fillStyle = '#FF5C5C'; // Close button color
                ctx.beginPath();
                ctx.arc(terminalX + 20, terminalY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
        
                ctx.fillStyle = '#FFBD44'; // Minimize button color
                ctx.beginPath();
                ctx.arc(terminalX + 40, terminalY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
        
                ctx.fillStyle = '#00CA56'; // Maximize button color
                ctx.beginPath();
                ctx.arc(terminalX + 60, terminalY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Terminal text settings
                ctx.fillStyle = 'white'; // Text color
                ctx.font = '16px monospace'; // Monospace font for terminal
                ctx.textBaseline = 'top';
    
                // Draw the terminal command and output
                const terminalCommand = '$ drw ./main.drw';
                const terminalOutput = 'Hello, World!';
                ctx.fillText(terminalCommand, terminalX + 15, terminalY + 45);
                ctx.fillText(terminalOutput, terminalX + 15, terminalY + 75);
                ctx.fillText('$ ', terminalX + 15, terminalY + 105);
            };

            const drawCode = () => {

                // Draw the MacOS-like window
                const windowWidth = canvasWidth * 0.6;
                const windowHeight = canvasHeight * 0.4;
                const windowX = (canvasWidth - windowWidth) / 1.2;
                const windowY = (canvasHeight - windowHeight) * 0.1;
        
                // Draw the window background
                ctx.fillStyle = '#11111b';
                ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
                
                // Draw window title bar
                ctx.fillStyle = '#11111b';
                ctx.fillRect(windowX, windowY, windowWidth, 30);
                
                // Draw close, minimize, and maximize buttons
                ctx.fillStyle = '#FF5C5C'; // Close button color
                ctx.beginPath();
                ctx.arc(windowX + 20, windowY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
        
                ctx.fillStyle = '#FFBD44'; // Minimize button color
                ctx.beginPath();
                ctx.arc(windowX + 40, windowY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
        
                ctx.fillStyle = '#00CA56'; // Maximize button color
                ctx.beginPath();
                ctx.arc(windowX + 60, windowY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
        
                // Draw the highlighted code
                ctx.fillStyle = 'black'; // Text color
                ctx.font = '16px monospace'; // Monospace font for code
                const codeLines = [
                    'import "#std"',
                    'import extern "libc" as libc',
                    '',
                    'using namespace std-- --::-- --ns ->',
                    '   printInC = (to_print: str) void ->',
                    '       libc.printf ( std-- --::-- --utils.libc_string (str) )',
                    '',
                    '   printInC ( "Hello, World!" )',
                ];

                const keywords = ["const", "import", "extern", "function", "using", "namespace"];
                const keywords_blue = ["->", "+", "-", "/", "*", "=", '::'];

                const findColor = (word, words, index) => {
                    if(keywords.includes(word)){
                        return "#f38ba8";
                    }
                    if(keywords_blue.includes(word)){
                        return "#94e2d5";
                    }
                    if(keywords.includes(word)){
                        return "#f38ba8";
                    }
                    if(words[index + 1]?.startsWith('(')){
                        return "#89b4fa";
                    }
                    if(word?.startsWith('"') || word.endsWith('"')){
                        return "#a6e3a1";
                    }
                    return "#cdd6f4";
                };
        
                // Draw each line of code with highlighting
                codeLines.forEach((line, index) => {
                    const words = line.split(' '); // Split line into words
                    let xOffset = windowX + 15; // Initial X position for the line

                    // Highlight words
                    words.forEach((word, wordIndex) => {
                        // Measure the width of the current word and space
                        let wordWidth = ctx.measureText(word).width;
                        let spaceWidth = ctx.measureText(' ').width;
                        if(words[wordIndex+1]?.startsWith('--') && word.endsWith('--')){
                            word = word.slice(word.startsWith('--') ? 2 : 0, -2);
                            wordWidth = ctx.measureText(word).width;
                        } else if(word.startsWith('--')){
                            word = word.slice(2, word.length);
                            wordWidth = ctx.measureText(word).width;
                        }

                        // Draw the word
                        ctx.fillStyle = findColor(word, words, wordIndex); // Text color
                        ctx.fillText(word, xOffset, windowY + 50 + index * 25);

                        // Update xOffset for the next word
                        xOffset += wordWidth + spaceWidth; // Move to the right for next word
                    });
                });
            }
    
            if(!isUpdate){
                const image = new Image();
                image.src = '/cat_leaves.png'; // Path to your wallpaper image
                image.onload = () => {
                    ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
                    drawTerminal();
                    drawCode();
                };
                ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
                drawTerminal();
                drawCode();
            }
            return true;
        },
        content: () => {
            return <div>Page 5 Content</div>;
        },
        title: "Highlighted Code in MacOS-like Window",
    }
    // Add more pages as needed
];

const App = () => {
    const [currentPage, setCurrentPage] = useState(3);
    const laptopRef = useRef();

    return (
        <div style={{
            display: 'flex',
            height: '100vh'
        }}>
            <Canvas
                camera={{
                    position: [-3, 2, 3], // Camera closer to the object and positioned at 8 o'clock (x, y, z)
                    fov: 35, // Narrower field of view for an isometric-like perspective
                }}>
                <directionalLight lookAt={() => laptopRef.current} intensity={1} />
                <directionalLight position={[-3, 2, -3]} lookAt={() => laptopRef.current} intensity={1} />
                <directionalLight position={[-3, 10, -3]} lookAt={() => laptopRef.current} intensity={1} />
                <directionalLight position={[3, 10, 3]} lookAt={() => laptopRef.current} intensity={1} />
                <ambientLight color={'#ffffff'} intensity={1} />
                <group ref={laptopRef}>
                <Laptop onClick={() => setCurrentPage((prev) => (prev + 1) % pageData.length)} currentPage={currentPage} />
                </group>
            </Canvas>
        </div>
    );
};

export default App;
