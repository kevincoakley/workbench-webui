import React, {useEffect, useState} from 'react';
import '../../index.css';
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {V1, handleError} from "../../common";

import {faCheckCircle} from "@fortawesome/free-solid-svg-icons/faCheckCircle";
import {faExclamationCircle} from "@fortawesome/free-solid-svg-icons/faExclamationCircle";
import {faPowerOff} from "@fortawesome/free-solid-svg-icons/faPowerOff";
import {faSpinner} from "@fortawesome/free-solid-svg-icons/faSpinner";
import {faTerminal} from "@fortawesome/free-solid-svg-icons/faTerminal";
import {faTrash} from "@fortawesome/free-solid-svg-icons/faTrash";
import {faRocket} from "@fortawesome/free-solid-svg-icons/faRocket";
import {faStop} from "@fortawesome/free-solid-svg-icons/faStop";
import {faCaretDown} from "@fortawesome/free-solid-svg-icons/faCaretDown";
import {faLink} from "@fortawesome/free-solid-svg-icons/faLink";
import {faTimes} from "@fortawesome/free-solid-svg-icons/faTimes";
import {faExpand} from "@fortawesome/free-solid-svg-icons/faExpand";
import {faEdit} from "@fortawesome/free-solid-svg-icons/faEdit";

import Console from "./Console";
import {useSelector} from "react-redux";
import {Navigate} from "react-router-dom";
import {colors} from "../../App";
import ReactGA from "react-ga";

import './MyApps.css';

const navigate = (stk: V1.Stack, ep: any) => {
    window.open(`${ep.protocol}://${ep.host}`, '_blank');
}

const sortBy = (s1: V1.Stack, s2: V1.Stack) => {
    const sid1 = s1.name+"";
    const sid2 = s2.name+""
    if (sid1 > sid2) {
        return 1;
    } else if (sid1 < sid2) {
        return -1;
    } else {
        return 0;
    }
}

/*const getSpec = async (key: string) => {
    return await V1.AppSpecService.getServiceById(key);
}*/

function MyAppsPage(props: any) {
    // Global state
    const darkThemeEnabled = useSelector((state: any) => state.preferences.darkThemeEnabled);
    const env = useSelector((state: any) => state.env);
    const user = useSelector((state: any) => state.auth.user);

    // Server data
    const [stacks, setStacks] = useState<Array<V1.Stack>>([]);
    const [specs, setSpecs] = useState<Array<V1.Service>>([]);

    // Redirect signal
    const [redirect, setRedirect] = useState('');

    // Refresh signal
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState<any>(undefined);

    // User Selections
    const [activated, setActivated] = useState(0);
    const [selectedService, setSelectedService] = useState<V1.StackService>();
    const [showSelected, setShowSelected] = useState(false);

    // Delete confirmation
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
    const [selectedApp, setSelectedApp] = useState<V1.Stack>();

    useEffect(() => {
        if (env?.customization?.product_name) {
            document.title = `${env?.customization?.product_name}: My Apps`;
        }
    }, [env]);

    useEffect(() => {
        if (env?.analytics_tracking_id) {
            ReactGA.pageview('/my-apps');
        }
    }, [env?.analytics_tracking_id]);

    useEffect(() => {
         const transient = stacks.filter(stk => stk?.status?.endsWith('ing'));
         if (transient.length && !autoRefresh) {
              setAutoRefresh(true);
         }

        if (autoRefresh && !refreshInterval) {
            //setInterval(() => refresh(), 1500);
            const interval = setInterval(() => refresh(), 1500);
            setRefreshInterval(interval);
        } else if (autoRefresh && !transient.length) {
            setAutoRefresh(false);
            if (refreshInterval) {
                clearInterval(refreshInterval);
                setRefreshInterval(undefined);
            }
        }
    }, [autoRefresh, refreshInterval, stacks, stacks.length]);

    useEffect(() => {
        if (!Object.keys(env).length) return;

        V1.AppSpecService.listServices().then(specs => setSpecs(specs)).catch(reason => handleError('Failed to fetch specs: ', reason));
        V1.UserAppService.listUserapps().then(stacks => setStacks(stacks)).catch(reason => handleError('Failed to fetch stacks: ', reason));
    }, [env]);

    const confirmDelete = (stack: V1.Stack) => {
        setSelectedApp(stack);
        setShowConfirmDelete(true);
    }

    const deleteStack = (stack?: V1.Stack) => {
        if (!stack) {
            return;
        }
        const stackId = stack.id+"";
        return V1.UserAppService.deleteUserapp(stackId).then(() => {
            if (env?.auth?.gaTrackingId) {
                ReactGA.event({
                    category: 'application',
                    action: 'delete',
                    label: stack.key
                });
            }
            console.log("Stack has been deleted: ", stackId);
            setShowConfirmDelete(false);
            refresh();
        }).catch(reason => handleError("Failed to delete stack", reason));
    }

    const refresh = (): Promise<V1.Stack[]> => {
        return V1.UserAppService.listUserapps().then(stacks => {
            return stacks.sort(sortBy);
        }).catch(reason => {
            handleError("Failed to fetch stacks", reason);
            return [];
        }).then(stks => {
            setStacks(stks);
            return stks;
        });
    }

    const startStack = (stack: V1.Stack) => {
        const stackId = stack.id + "";
        return V1.UserAppService.startStack(stackId)
            .catch(reason => handleError("Failed to start stack", reason))
            .then((resp) => {
                if (!resp) return;

                if (env?.auth?.gaTrackingId) {
                    ReactGA.event({
                        category: 'application',
                        action: 'start',
                        label: stack.key
                    });
                }
                console.log("Stack is now starting...");
                refresh();
            });
    }

    const stopStack = (stack: V1.Stack) => {
        const stackId = stack.id + "";
        return V1.UserAppService.stopStack(stackId)
            .catch(reason => handleError("Failed to stop stack", reason))
            .then((resp) => {
                if (!resp) return;

                if (env?.auth?.gaTrackingId) {
                    ReactGA.event({
                        category: 'application',
                        action: 'stop',
                        label: stack.key
                    });
                }
                console.log("Stack is now stopping...");
                refresh();
            });
    }

    const editStack = (stack: V1.Stack) => {
        window.location.href = `/my-apps/${stack?.id}/edit`;
    }

    const openConsole = (stack: V1.Stack, svc: V1.StackService) => {
        // TODO: open a console
        // TODO: , backdrop: 'static', keyboard: false
        //const state = JSON.parse(JSON.stringify(this.state));
        //setState({ selectedService: svc, showSelected: true });
        setSelectedService(svc);
        setShowSelected(true);
        if (env?.auth?.gaTrackingId) {
            ReactGA.modalview('/my-apps/console');
        }
    }

    const closeConsole = () => {
        //const state = JSON.parse(JSON.stringify(this.state));
        //setState({ showSelected: false, selectedService: undefined });
        setShowSelected(false);
        setSelectedService(undefined);
    }

    const openConsoleInNewTab = () => {
        window.open(`/my-apps/${selectedService?.id}/console`, '_blank');
    }

    const computeStackBorderColor = (stack: V1.Stack, index: number) => {
        return index !== activated && !darkThemeEnabled ? '#EBEBEB' : (stack.status === 'started' ? '#CDFFD2' :    // green / ready
            (stack.status?.endsWith('ing') ? '#F8DB66' :  // yellow / warning
                (stack.status === 'error' ? '#EB2A52' :               // red / error
                    darkThemeEnabled ? '#283845': '#EBEBEB')))
    }

    const computeStackBackgroundColor = (stack: V1.Stack, index: number) => {
        return (stack.status === 'started' ? '#CDFFD2' :    // green / ready
            (stack.status?.endsWith('ing') ? '#F8DB66' :  // yellow / warning
                (stack.status === 'error' ? '#EB2A52' :               // red / error
                    darkThemeEnabled ? '#283845': '#FFFFFF')))
    }

    return (
        <Container fluid={false}>
            {
                redirect && <Navigate to={redirect} replace />
            }
            <div style={{ height: "10vh" }}></div>
            <Accordion activeKey={activated+''}>
                {
                    // Placeholder for when no applications have been added
                    (!stacks || !stacks.length) && <>
                        <div style={{
                            minHeight: '60vh',
                            border: darkThemeEnabled ? colors.textColor.dark + ' 3px dashed' : colors.textColor.light + ' 3px dashed',
                            borderRadius: '15px',
                            textAlign:'center',
                            backgroundColor: darkThemeEnabled ? colors.foregroundColor.dark : colors.foregroundColor.light
                        }}>
                            <h3 style={{ marginTop: '25vh' }}>
                                Your applications from the catalog will appear here.
                            </h3>
                            <p>
                                <strong>Please use the ? menu at the top of the page to access the User's Guide.</strong>
                            </p>
                            <strong>View the list of <Button variant={'link'} size={'sm'} style={{ padding: 0, textDecoration: "none", marginTop: "-4px" }} onClick={() => setRedirect('/all-apps')}>All Apps</Button> to add and launch a new App.</strong>
                        </div>
                    </>
                }
                {
                    // Show the list of all applications added by the user
                    stacks.sort(sortBy).map((stack, index) =>
                        <Accordion.Item eventKey={index+''} as={Card} key={stack.id} style={{ marginTop: "25px", borderRadius: "20px", borderWidth: "2px",
                            borderColor: computeStackBorderColor(stack, index),
                            backgroundColor: darkThemeEnabled ? '#283845' : '#fff'}}>
                            <Card.Header style={{
                                textAlign: "left",
                                borderRadius: activated === index ? "18px 18px 0 0" : "18px",
                                borderBottomColor: activated !== index || stack.status !== 'stopped' ? 'transparent' : darkThemeEnabled ? 'white' : 'lightgrey',
                                color: stack.status === 'stopped' && darkThemeEnabled ? 'white' : 'black',
                                backgroundColor: computeStackBackgroundColor(stack, index),       // night mode bg / default bg
                            }}>
                                <Row>
                                    <Col xs={1}>
                                        <img alt={'logo'} width="60" height="60" src={specs.find(s => s.key === stack.key)?.logo || '/ndslabs-badge.png'} style={{
                                            borderRadius: "50px",
                                            border: "solid 1px lightgrey"
                                        }} />
                                    </Col>
                                    <Col style={{ textAlign: "left"}}>
                                        <h4 style={{ marginTop: "15px" }}>{stack.name || stack.id}
                                            <span style={{ marginLeft: "30px" }}>
                                                {(!stack?.status || stack?.status === 'stopped') && <FontAwesomeIcon icon={faPowerOff} />}
                                                {(stack?.status === 'started') && <FontAwesomeIcon icon={faCheckCircle}  />}
                                                {(stack?.status === 'error') && <FontAwesomeIcon icon={faExclamationCircle}  />}
                                                {(stack?.status === 'stopping' || stack?.status === 'starting') && <FontAwesomeIcon icon={faSpinner} className={'fa-pulse'} />}
                                            </span>
                                        </h4>
                                    </Col>
                                    <Col xs={3} style={{ textAlign: "right", marginTop: "10px" }}>
                                        <Button variant="link" onClick={() => confirmDelete(stack)} style={{ color: darkThemeEnabled && stack.status === 'stopped' ? 'white' : 'black' }} title={'Remove application (' + stack.id + ')'}><FontAwesomeIcon icon={faTrash} /></Button>
                                        {
                                            user?.groups?.includes('/workbench-developers') && <Button variant="link" onClick={() => editStack(stack)}
                                                    style={{color: darkThemeEnabled && stack.status === 'stopped' ? 'white' : 'black'}}
                                                    title={'Edit application (' + stack.id + ')'}><FontAwesomeIcon
                                                icon={faEdit}/></Button>
                                        }
                                        {(!stack.status || stack.status === 'stopped') && <>
                                            <Button variant="link" onClick={() => startStack(stack)} style={{ color: darkThemeEnabled ? 'white' : 'black' }} title={'Launch this stack'}><FontAwesomeIcon icon={faRocket} /></Button>
                                        </>}
                                        {(stack.status === 'started' || stack.status === 'error' || stack.status === 'starting' || stack.status === 'stopping') && <>
                                            <Button variant="link" onClick={() => stopStack(stack)} style={{ color: 'black' }} title={'Shutdown this stack'}><FontAwesomeIcon icon={faStop} /></Button>
                                        </>}
                                    </Col>
                                    <Col xs={1} style={{ marginTop: "3px" }}>
                                        <Button variant={"link"} style={{
                                            color: darkThemeEnabled && stack.status === 'stopped' ? 'white' : 'black',
                                            marginRight: "10px",
                                            background: 'transparent',
                                            marginLeft: "30px",
                                            display: activated === index ? "none" : ""
                                        }} onClick={() => setActivated(index)}>
                                            <FontAwesomeIcon icon={faCaretDown} size={'2x'} />
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Header>
                            <Accordion.Body as={Card.Body} style={{ padding: "40px 120px" }}>
                                <Table className='compact' responsive='sm' borderless={true} style={{ backgroundColor: darkThemeEnabled ? '#283845' : '#fff', color: darkThemeEnabled ? 'white' : 'black' }}>
                                    <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Name</th>
                                        <th>ID</th>
                                        <th hidden={stack.status !== 'started'}></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        (stack.services || []).map(svc =>
                                            <tr key={svc.id}>
                                                <td key={svc.id+"-status"} width='10%'>{svc.status || 'Stopped'}</td>
                                                <td key={svc.id+"-endpoints"} width='40%'>{svc.service}
                                                    {
                                                        svc?.endpoints?.map(ep => ep.host &&
                                                            <Button variant="link"
                                                                    key={svc.id+"-endpoint-link-"+ep.host}
                                                                    size={'sm'}
                                                                    hidden={svc.status !== 'started'}
                                                                    title={'Open ' + svc.service + ' in a new tab'}
                                                                    onClick={() => navigate(stack, ep)}
                                                                    style={{ marginLeft: "20px" }}>
                                                                <FontAwesomeIcon icon={faLink} />
                                                            </Button>
                                                        )
                                                    }
                                                </td>
                                                <td key={svc.id+"-id"}>{svc.id}</td>
                                                <td key={svc.id+"-buttons"} width='10%' style={{ textAlign: "center"}}>
                                                    <Button variant="link" size={'sm'} style={{
                                                        color: darkThemeEnabled ? 'white' : 'black',
                                                        borderColor: darkThemeEnabled ? 'white' : 'black',
                                                        width: "35px", height: "30px",
                                                        borderWidth: "2px", borderRadius: "0",
                                                        padding: "3px" }}
                                                            hidden={svc?.status?.toLowerCase() !== 'started'}
                                                            onClick={() => openConsole(stack, svc)}>
                                                        <FontAwesomeIcon icon={faTerminal} />
                                                    </Button>
                                                </td>
                                            </tr>

                                        )
                                    }
                                    </tbody>
                                </Table>
                            </Accordion.Body>
                        </Accordion.Item>
                    )
                }
            </Accordion>

            <Modal show={showConfirmDelete}
                   fullscreen={'true'}>
                <Modal.Header style={{
                    backgroundColor: darkThemeEnabled ? colors.foregroundColor.dark : colors.foregroundColor.light,
                    color: darkThemeEnabled ? colors.textColor.dark : colors.textColor.light,
                }}>
                    <Modal.Title>Confirm Delete: {selectedApp?.id}</Modal.Title>
                    <div>
                        <Button variant={darkThemeEnabled ? 'dark' : 'light'} onClick={() => setShowConfirmDelete(false)}>
                            <FontAwesomeIcon icon={faTimes} />
                        </Button>
                    </div>
                </Modal.Header>
                <Modal.Body style={{
                    backgroundColor: darkThemeEnabled ? colors.backgroundColor.dark : colors.backgroundColor.light,
                    color: darkThemeEnabled ? colors.textColor.dark : colors.textColor.light,
                }}>
                    <p>You are about to delete your instance of the {selectedApp?.name}.</p>
                    <p>Are you sure?</p>
                </Modal.Body>
                <Modal.Footer style={{
                    backgroundColor: darkThemeEnabled ? colors.foregroundColor.dark : colors.foregroundColor.light,
                    color: darkThemeEnabled ? colors.textColor.dark : colors.textColor.light,
                }}>
                    <Button variant="secondary" onClick={() => setShowConfirmDelete(false)}>No</Button>
                    <Button variant="primary" onClick={() => deleteStack(selectedApp)}>Yes</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showSelected}
                   onHide={closeConsole}
                   backdrop="static"
                   fullscreen={'true'}
                   size={'xl'}
                   keyboard={false}>
                <Modal.Header style={{
                    backgroundColor: darkThemeEnabled ? '#212529' : 'white',
                    color: darkThemeEnabled ? 'white' : 'black',
                }}>
                    <Modal.Title>Application Console: {selectedService?.id}</Modal.Title>
                    <div>
                        <Button variant={darkThemeEnabled ? 'dark' : 'light'} onClick={openConsoleInNewTab}>
                            <FontAwesomeIcon icon={faExpand} />
                        </Button>
                        <Button variant={darkThemeEnabled ? 'dark' : 'light'} onClick={closeConsole}>
                            <FontAwesomeIcon icon={faTimes} />
                        </Button>
                    </div>
                </Modal.Header>
                <Modal.Body as={Console} stackServiceId={selectedService?.id} />

            </Modal>
        </Container>
    );
    /*
    <Modal.Footer>
                    <Button variant="secondary" onClick={closeConsole}>
                        Close
                    </Button>
                </Modal.Footer>
     */
}

export default MyAppsPage;
