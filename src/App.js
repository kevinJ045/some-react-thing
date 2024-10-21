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

        const drawContent = () => {
            updateFunction.current = (null);
            events.current.removeAll();
            states = {};

            context.clearRect(0, 0, canvas.width, canvas.height);
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
    }, [currentPage]);

    useEffect(() => {
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

    const toggleLid = () => {
        if (openState) {
            // Lid Closing
            setOpenState(false);
            // animationMixer.clipAction(findAnimation("OpenLid")).play(); // Assuming CloseLid is the second animation
        } else {
            // Lid Opening
            setOpenState(true);
            // animationMixer.clipAction(findAnimation("CloseLid")).play(); // Assuming OpenLid is the third animation
        }
        onClick();
    };

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
            ctx.fillText(':(', 50, 130);
            ctx.font = '20px Consolas';
            
            const bsodText = `
            Your PC ran into a problem and needs to restart.
            We're just collecting some error info, and then we'll restart for you.

            For more information about this issue and possible fixes, visit www.windows.com
            If you call a support person, give them this info:
            Stop Code: CRITICAL_PROCESS_DIED`;

            const lines = bsodText.split('\n');
            let y = 200; 
            lines.forEach(line => {
                ctx.fillText(line.trim(), 50, y);
                y += 30;
            });
        },
        content: () => <div>Page 0 Content</div>,
        title: "Page 0",
    },
    {
        pageId: 1,
        screen: (ctx, isUpdate, delta, states) => {
            const canvasWidth = ctx.canvas.width;
            const canvasHeight = ctx.canvas.height;
            
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
            if (!isUpdate) {
                states.rotation = 0;
                states.logoRadius = 20;
                states.dotRadius = 2;
                states.numDots = 10;
                states.centerX = canvasWidth / 2;
                states.centerY = canvasHeight / 5;
                states.loadingCenterY = canvasHeight / 2.5;
                states.logoColor = '#00a4ef';
            } else {
                states.rotation += 0.05;
            }
    
            const spacing = canvasWidth * 0.01;
            const rectWidth = 40;
            const rectHeight = 40;
    
            ctx.fillStyle = states.logoColor;
            ctx.fillRect(states.centerX - rectWidth - spacing / 2, states.centerY - rectHeight - spacing / 2, rectWidth, rectHeight);
    
            ctx.fillRect(states.centerX + spacing / 2, states.centerY - rectHeight - spacing / 2, rectWidth, rectHeight);
    
            ctx.fillRect(states.centerX - rectWidth - spacing / 2, states.centerY + spacing / 2, rectWidth, rectHeight);
    
            ctx.fillRect(states.centerX + spacing / 2, states.centerY + spacing / 2, rectWidth, rectHeight);
    
            ctx.save();
            ctx.translate(states.centerX, states.loadingCenterY);

            for (let i = 0; i < states.numDots; i++) {
                const angle = (i / states.numDots) * Math.PI * 2;
                const x = Math.cos(angle + states.rotation) * states.logoRadius;
                const y = Math.sin(angle + states.rotation) * states.logoRadius;
    
                ctx.beginPath();
                ctx.arc(x, y, states.dotRadius, 0, Math.PI * 2);
                ctx.fillStyle = i == states.numDots - 1 ? 'black' : 'white';
                ctx.fill();
            }
    
            ctx.restore();
    
            return true;
        },
        content: () => <div>Page 1 Content</div>,
        title: "Page 1",
    },
    {
        pageId: 2,
        screen: (ctx, isUpdate, delta, states) => {
            const canvasWidth = ctx.canvas.width;
            const canvasHeight = ctx.canvas.height;

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            if (!isUpdate) {
                states.textY = canvasHeight * 0.3;
                states.lineHeight = 20;
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
                states.currentMessage = 0;
                states.lastUpdate = 0;
            } else {
                states.lastUpdate += 1;
                if (states.lastUpdate > 10) {
                    states.currentMessage = (states.currentMessage + 1) % states.messages.length;
                    states.lastUpdate = 0;
                }
            }
            
            ctx.fillStyle = 'white';
            ctx.font = '16px monospace'; 

            for (let i = 0; i < states.messages.length; i++) {
                ctx.fillText(states.messages[i], canvasWidth * 0.1, states.textY + i * states.lineHeight);
            }
    
            ctx.fillStyle = '#00FF00';
            ctx.fillText(states.messages[states.currentMessage], canvasWidth * 0.1, states.textY + states.currentMessage * states.lineHeight);
    
            return true;
        },
        content: () => <div>Page 2 Content</div>,
        title: "Linux Boot Screen",
    },

    {
        pageId: 5,
        screen: (ctx, isUpdate, delta, states) => {
            const canvasWidth = ctx.canvas.width;
            const canvasHeight = ctx.canvas.height;

            const drawTerminal = () => {
                const terminalWidth = canvasWidth * 0.2;
                const terminalHeight = canvasHeight * 0.2;
                const terminalX = (canvasWidth - terminalWidth) / 10;
                const terminalY = (canvasHeight - terminalHeight) * 0.1;

                ctx.fillStyle = '#11111b';
                ctx.fillRect(terminalX, terminalY, terminalWidth, terminalHeight);

                ctx.fillStyle = '#FF5C5C'; // Close color
                ctx.beginPath();
                ctx.arc(terminalX + 20, terminalY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
        
                ctx.fillStyle = '#FFBD44'; // Minimize color
                ctx.beginPath();
                ctx.arc(terminalX + 40, terminalY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
        
                ctx.fillStyle = '#00CA56'; // Maximize color
                ctx.beginPath();
                ctx.arc(terminalX + 60, terminalY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = 'white';
                ctx.font = '16px monospace';
    
                const terminalCommand = '$ drw ./main.drw';
                const terminalOutput = 'Hello, World!';
                ctx.fillText(terminalCommand, terminalX + 15, terminalY + 55);
                ctx.fillText(terminalOutput, terminalX + 15, terminalY + 75);
                ctx.fillText('$', terminalX + 15, terminalY + 95);
            };

            const drawCode = () => {
                const windowWidth = canvasWidth * 0.6;
                const windowHeight = canvasHeight * 0.4;
                const windowX = (canvasWidth - windowWidth) / 1.2;
                const windowY = (canvasHeight - windowHeight) * 0.1;
        
                ctx.fillStyle = '#11111b';
                ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
                
                ctx.fillStyle = '#11111b';
                ctx.fillRect(windowX, windowY, windowWidth, 30);
                
                ctx.fillStyle = '#FF5C5C'; // Close color
                ctx.beginPath();
                ctx.arc(windowX + 20, windowY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
        
                ctx.fillStyle = '#FFBD44'; // Minimize color
                ctx.beginPath();
                ctx.arc(windowX + 40, windowY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
        
                ctx.fillStyle = '#00CA56'; // Maximize color
                ctx.beginPath();
                ctx.arc(windowX + 60, windowY + 15, 5, 0, Math.PI * 2);
                ctx.fill();
        
                ctx.fillStyle = 'black';
                ctx.font = '16px monospace';
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
        
                codeLines.forEach((line, index) => {
                    const words = line.split(' ');
                    let xOffset = windowX + 15;
                    
                    words.forEach((word, wordIndex) => {
                        let wordWidth = ctx.measureText(word).width;
                        let spaceWidth = ctx.measureText(' ').width;
                        if(words[wordIndex+1]?.startsWith('--') && word.endsWith('--')){
                            word = word.slice(word.startsWith('--') ? 2 : 0, -2);
                            wordWidth = ctx.measureText(word).width;
                        } else if(word.startsWith('--')){
                            word = word.slice(2, word.length);
                            wordWidth = ctx.measureText(word).width;
                        }

                        ctx.fillStyle = findColor(word, words, wordIndex);
                        ctx.fillText(word, xOffset, windowY + 50 + index * 25);

                        xOffset += wordWidth + spaceWidth;
                    });
                });
            }
    
            if(!isUpdate){
                const image = new Image();
                image.src = '/cat_leaves.png';
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
    },
    {
        pageId: 4,
        screen: (ctx, isUpdate, delta, states, events) => {
            const canvasWidth = ctx.canvas.width;
            const canvasHeight = ctx.canvas.height;
    
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            if (!isUpdate) {
                states.textY = canvasHeight * 0.1;
                states.lineHeight = 24;
                states.history = [];
                states.currentInput = '';
                states.prompt = '$ ';

                events.on('keydown', (event) => {
                    event.preventDefault();
                    const key = event.key;
                    if (key === 'Enter') {
                        const command = states.currentInput.trim();
                        const folders = [
                            "bin  boot dev etc",
                            "home lib  opt temp",
                            "root run  sys proc",
                            "usr  var"
                        ];
                        const commands = ["bash", "dd", "rm", "mkdir", "touch", "cp", "cd"];
                        if (command) {
                            states.history.push(states.prompt + command);
                            if (command === 'help') {
                                states.history.push('Available commands: help, clear, ls, echo <message>');
                            } else if (command === 'clear') {
                                states.history = [];
                            } else if (command.startsWith('echo ')) {
                                const message = command.slice(5);
                                states.history.push(message);
                            } else if (commands.includes(command.split(' ')[0])) {
                            } else if (command.startsWith('ls')) {
                                const message = command.slice(2);
                                if(message && message.trim() !== '/') states.history.push(folders.join(' ').match(message.trim()) ? `"${message.trim()}": Permission denied (os error 13)` : `"${message.trim()}": No such file or directory (os error 2)`);
                                else states.history.push(...folders);
                            } else {
                                states.history.push(`bash: ${command}: command not found`);
                            }
                        }
                        states.currentInput = '';
                    } else if (key === 'Backspace') {
                        states.currentInput = states.currentInput.slice(0, -1);
                    } else if (key?.length === 1) {
                        states.currentInput += key;
                    }
                });
                
            }

            ctx.fillStyle = '#48ff22';
            ctx.font = '20px monospace';
            
            for (let i = 0; i < states.history.length; i++) {
                ctx.fillText(states.history[i], canvasWidth * 0.1, states.textY + i * states.lineHeight);
            }
    
            ctx.fillText(states.prompt + states.currentInput, canvasWidth * 0.1, states.textY + states.history.length * states.lineHeight);

            const cursorX = canvasWidth * 0.1 + ctx.measureText(states.prompt + states.currentInput).width;
            const cursorY = states.textY + states.history.length * states.lineHeight - 18;
            ctx.fillRect(cursorX, cursorY, 2, 20); 

            return true;
        },
        content: () => {
            return <div>Page 4 Content</div>;
        },
        title: "Linux-like Terminal",
    }
];

const App = () => {
    const [currentPage, setCurrentPage] = useState(4);
    const laptopRef = useRef();

    return (
        <div style={{
            display: 'flex',
            height: '100vh'
        }}>
            <Canvas
                camera={{
                    position: [-4, 3, 4],
                    fov: 35,
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
