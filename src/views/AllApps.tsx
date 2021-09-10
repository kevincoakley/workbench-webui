import React, {Component, useEffect, useState} from 'react';
import {Container, Row, Col, ListGroup, Jumbotron, Dropdown, DropdownButton} from 'react-bootstrap';
import { V1, Card, handleError } from '../common';

import Cookies from "universal-cookie";
import {createMuiTheme, Input, MuiThemeProvider} from "@material-ui/core";

const cookies = new Cookies();

interface VocabTerm {
    id?: string;
    name?: string;
    definition?: string;
}

interface AllAppsState {
    specs: Array<V1.Service>;
    tags: Array<VocabTerm>;
    stacks: Array<V1.Stack>;
}

const theme = createMuiTheme({
    palette: {
        type: 'dark'
    },
})


function AllAppsPage() {
    const [tags, setTags] = useState<Array<VocabTerm>>([]);

    const [stacks, setStacks] = useState<Array<V1.Stack>>([]);
    const [specs, setSpecs] = useState<Array<V1.Service>>([]);
    const [categoryName, setCategoryName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [filter, setFilter] = useState('');


    useEffect(() => {
        V1.VocabularyService.getVocabularyByName('tags').then(vocab => {
            console.log("Vocabulary: ", vocab);
            setTags(vocab.terms || []);
        }).catch(reason => handleError("Failed to fetch tags", reason));

        V1.AppSpecService.listServices('all').then(specs => {
            console.log("App specs: ", specs);
            // Sort by label or key
            const sorted = specs.sort((s1, s2) => {
                const lc1 = s1.label?.toLowerCase() || s1.key;
                const lc2 = s2.label?.toLowerCase() || s2.key;
                return lc1.localeCompare(lc2);
            }).filter((spec) => {
                if (!filter) return true;
                if (spec?.tags?.includes(filter)) return true;
            }).filter((spec) => {
                if (!searchQuery) return true;
                if (spec?.label?.includes(searchQuery)) return true;
                if (spec?.key?.includes(searchQuery)) return true;
                if (spec?.description?.includes(searchQuery)) return true;
                if (spec?.maintainer?.includes(searchQuery)) return true;
            })
            setSpecs(sorted || []);
        }).catch(reason => handleError("Failed to fetch app specs", reason));

        V1.UserAppService.listStacks().then(stacks => {
            console.log("User apps: ", stacks);
            // Sort by label or key
            const sorted = stacks.sort((s1, s2) => {
                const lc1 = s1.name?.toLowerCase() || s1.key;
                const lc2 = s2.name?.toLowerCase() || s2.key;
                return lc1.localeCompare(lc2);
            });
            setStacks(sorted || []);
        }).catch(reason => handleError("Failed to fetch user apps", reason));
    }, [specs.length, stacks.length, tags.length, filter, searchQuery]);

    return (
        <MuiThemeProvider theme={theme}>
            <Container fluid={true} style={{ paddingLeft: "0", paddingRight: "0" }}>
                <Jumbotron className='bg-banner' style={{
                    width: "100%",
                    color: "white",
                    background: "linear-gradient(rgba(200, 0, 0, 0.35),rgba(200, 0, 0, 0.35)),url('/catalog-banner.jpg')",
                    backgroundSize: "1800px 500px",
                    backgroundPosition: "-120px -100px",
                    backgroundRepeat: "no-repeat",
                    padding: "80px",
                    fontWeight: "bold",
                }}>
                    <h1 style={{paddingTop: "25px"}}>Explore Apps from NCSA</h1>
                    <Input style={{ color: "white", width: "450px" }} placeholder={"Search for apps..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </Jumbotron>
                <Row style={{ marginLeft: "20px", marginRight: "20px", marginTop: "40px" }}>
                    <Col className='col-3'>
                        <h3>Tags</h3>

                        <Dropdown style={{ margin: "20px" }}>
                            <DropdownButton title={categoryName || 'Select a category...'} style={{ width: "100%", borderRadius: "20px" }}>
                                <Dropdown.Item onClick={() => setCategoryName('')}>All Categories</Dropdown.Item>
                                <Dropdown.Item onClick={() => setCategoryName('Category 1')}>Category 1</Dropdown.Item>
                                <Dropdown.Item onClick={() => setCategoryName('Category 2')}>Category 2</Dropdown.Item>
                                <Dropdown.Item onClick={() => setCategoryName('Category 3')}>Category 3</Dropdown.Item>
                            </DropdownButton>
                        </Dropdown>

                        <ListGroup defaultActiveKey="#all">
                            <ListGroup.Item active={filter==='featured'} key={"tag-featured"} action href={"#Featured"} onClick={() => setFilter('featured')} title="Show all applications">
                                Featured
                            </ListGroup.Item>
                            <ListGroup.Item active={!filter} key={"tag-all"} action href={"#All"} onClick={() => setFilter('')} title="Show all applications">
                                Show All
                            </ListGroup.Item>
                            {
                                tags.map(tag =>
                                    <ListGroup.Item active={filter === tag.id} key={"tag-"+tag.id} action href={"#"+tag.name} onClick={() => setFilter(tag.id+"")} title={tag.definition}>
                                        {tag.name}
                                    </ListGroup.Item>
                                )
                            }
                        </ListGroup>
                    </Col>

                    <Col>
                        <Row>
                            <Col>
                                <h3>{!filter ? 'All' : filter === 'featured' ? 'Featured' : tags.find(t => filter === t.id)?.name} Apps</h3>
                            </Col>
                        </Row>

                        <Row>
                            {
                                specs.map(spec =>
                                    <Col className='col-3' key={spec.key} style={{ padding: "20px"}}>
                                        <Card key={'spec-'+spec.key} specs={specs} stacks={stacks} spec={spec} tags={tags} />
                                    </Col>
                                )
                            }
                        </Row>
                    </Col>
                </Row>
            </Container>
        </MuiThemeProvider>
    );
}

export default AllAppsPage;