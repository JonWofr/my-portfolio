import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { cloneDeep } from 'lodash';

// Utils
import * as http from '../../utils/http';
import * as parser from '../../utils/parser';
import * as intersectionObserver from '../../utils/intersectionObserver';

// Styles
import styles from './Projects.module.scss';

// Components
import Project from '../../components/Project';
import Header from '../../components/Header';
import FiltersBar from '../../components/FiltersBar';

// FormElementDefinitions
import * as models from '../../models/formElementDefinitions';

class Projects extends Component {
    constructor(props) {
        super(props);

        this.state = {
            page: undefined,
            lastPage: undefined,
            projects: [],
            filters: parser.parseFormElementDefinitionsToFilters(models.projectOverviewFormElementDefinitions),
            searchFieldValue: ""
        }

        this.debouncerTimeoutId = undefined;
        this.projectsObserver = undefined;
    }

    render() {
        const { projects, filters, searchFieldValue } = this.state;

        const projectIds = Object.keys(projects);

        return (
            <Fragment>
                <Header />
                <main>
                    <div className={styles.filtersBarOuterContainer}>
                        <div className={styles.filtersBarInnerContainer}>
                            <FiltersBar
                                filters={filters}
                                onChangeCheckbox={this.onChangeFilterCheckbox}
                                searchFieldValue={searchFieldValue}
                                onChangeSearchFieldValue={this.onChangeSearchFieldValue}
                                onClickClearFiltersButton={this.onClickClearFiltersButton}
                            />
                        </div>
                    </div>
                    <div className={`${styles.projectsContainer} projectsOberserverItemsParent`}>
                        {
                            projectIds.map((projectId, projectIdIndex) => {
                                const { projectName, categories, languages, technologies, teamMembers, startDate, endDate, gitRepoLink, paragraphs } = projects[projectId];
                                return (
                                    <div className={`${styles.projectOuterContainer} projectsObserverItem`}>
                                        <div className={styles.projectInnerContainer}>
                                            <Project
                                                projectName={projectName}
                                                categories={categories}
                                                languages={languages}
                                                technologies={technologies}
                                                teamMembers={teamMembers}
                                                startDate={startDate}
                                                endDate={endDate}
                                                gitRepoLink={gitRepoLink}
                                                paragraphs={paragraphs}
                                                colorMode={projectIdIndex % 2 === 0 ? "dark" : "light"}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </main>
            </Fragment>
        );
    }

    componentDidMount = () => {

        this.projectsObserver = intersectionObserver.getListItemIntersectionObserver(async () => {
            const { page } = this.state;
            const queryObject = {
                page: page + 1,
            }
            this.fetchProjects(queryObject)
        }, {});

        this.initiallyFetchProjects();
    }

    initiallyFetchProjects = async (queryObject) => {
        const queryString = queryObject ? parser.parseObjectToQueryString(queryObject) : "";
        const { response: { data, appendix: { page, lastPage } } } = await http.get(`${process.env.REACT_APP_BACKEND_URL}/projects${queryString}`);

        const projects = parser.parseDocumentsToProjects(data);

        this.setState({
            page,
            lastPage,
            projects
        }, this.observeLastProject);
    }

    fetchProjects = async (queryObject) => {
        const { projects } = this.state;

        const queryString = queryObject ? parser.parseObjectToQueryString(queryObject) : "";
        const { response: { data, appendix: { page, lastPage } } } = await http.get(`${process.env.REACT_APP_BACKEND_URL}/projects${queryString}`);

        const newProjects = parser.parseDocumentsToProjects(data);

        this.setState({
            page,
            lastPage,
            projects: {
                ...projects,
                ...newProjects
            }
        }, this.observeLastProject);
    }

    observeLastProject = () => {
        const { page, lastPage } = this.state;
        if (page !== lastPage) {
            const lastProject = document.querySelector(`.projectsObserverItem:last-child`);
            if (lastProject !== null) this.projectsObserver.observe(lastProject);
        }
    }

    onChangeSearchFieldValue = ({ target: { value } }) => {
        const { filters } = this.state;

        const query = parser.parseFiltersAndSearchFieldValueToMongoDbQueryObject(filters, value);

        const queryObject = {
            query
        }

        this.projectsObserver = intersectionObserver.getListItemIntersectionObserver(async () => {
            const { page } = this.state;
            const queryObject = {
                page: page + 1,
                query
            }
            this.fetchProjects(queryObject)
        }, {});

        this.debounce(this.initiallyFetchProjects(queryObject), 500)

        this.setState({
            searchFieldValue: value
        })
    }

    debounce = (timeoutCallback, ms) => {
        if (this.debouncerTimeoutId) clearTimeout(this.debouncerTimeoutId);
        this.debouncerTimeoutId = setTimeout(timeoutCallback, ms);
    }

    onChangeFilterCheckbox = (name, value, isChecked) => {
        const { filters, searchFieldValue } = this.state;

        const deepClonedFilters = cloneDeep(filters);

        const affectedFilter = deepClonedFilters.find(deepClonedFilter => deepClonedFilter.name === name);
        const affectedListItem = affectedFilter.listItems.find(listItem => listItem.value === value);
        affectedListItem.isChecked
            ? this.decrementCheckedCheckboxesCount(affectedFilter)
            : this.incrementCheckedCheckboxesCount(affectedFilter);
        affectedListItem.isChecked = isChecked;

        const query = parser.parseFiltersAndSearchFieldValueToMongoDbQueryObject(deepClonedFilters, searchFieldValue);

        const queryObject = {
            query
        }

        this.projectsObserver = intersectionObserver.getListItemIntersectionObserver(async () => {
            const { page } = this.state;
            const queryObject = {
                query,
                page: page + 1,
            }
            this.fetchProjects(queryObject)
        }, {});

        this.debounce(this.initiallyFetchProjects(queryObject), 500)

        this.setState({
            filters: deepClonedFilters
        })
    }

    incrementCheckedCheckboxesCount = (filter) => filter.checkedCheckboxesCount++;

    decrementCheckedCheckboxesCount = (filter) => filter.checkedCheckboxesCount--;

    onClickClearFiltersButton = () => {
        const { filters } = this.state;

        const deepClonedFilters = cloneDeep(filters);

        deepClonedFilters.forEach(deepClonedFilter => {
            deepClonedFilter.checkedCheckboxesCount = 0;
            deepClonedFilter.listItems.forEach(listItem => listItem.isChecked = false)
        });

        if (this.debouncerTimeoutId) clearTimeout(this.debouncerTimeoutId);

        this.projectsObserver = intersectionObserver.getListItemIntersectionObserver(async () => {
            const { page } = this.state;
            const queryObject = {
                page: page + 1,
            }
            this.fetchProjects(queryObject)
        }, {});

        this.initiallyFetchProjects();

        this.setState({
            filters: deepClonedFilters,
            searchFieldValue: ""
        })
    }
}

export default Projects;