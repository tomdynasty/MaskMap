import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Layout, message } from 'antd';
import PropTypes from 'prop-types';

import { dispatchReceiveDrugStores } from '../Redux/Action/DrugStore';
import Option from './Option';
import DrugStore from './DrugStore';
import Map from './Map';
import counties from '../Common/County';

class MaskMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      towns: [],
      selectedCounty: '',
      filteredDrugStores: [],
      locations: [],
      zoom: 11,
      apiMaps: {},
      available: '',
      infoWindowContent: {},
    };
  }

  setGoogleMaps = (map, maps) => {
    this.setState({
      apiMaps: {
        mapInstance: map,
        mapApi: maps,
      },
    });
  }

  async componentDidMount() {
    await this.props.dispatchReceiveDrugStores();
    await this.loadTownsFromCounty(counties[1]);
    await this.initializeDrugStores();
  }

  loadTownsFromCounty = (val) => {
    const { drugStoresMatchedMap } = this.props;
    const towns = [];
    drugStoresMatchedMap.forEach((el) => {
      const { properties } = el;
      const { town, county } = properties;
      if ((!towns.includes(town)) && (county === val)) {
        towns.push(town);
      }
    });
    this.setState({
      ...this.state,
      towns,
      selectedCounty: val,
    });
  }

  onsubmitSearch = (selCounty, selTown) => {
    const found = this.loadFilterdDrugStore(selCounty, selTown);
    this.setState({
      filteredDrugStores: found,
      zoom: 14,
    });
    const newLocations = [];
    found.forEach((el) => {
      el.geometry.coordinates[2] = false;
      newLocations.push(el.geometry.coordinates);
    });
    if (newLocations.length === 0) {
      message.info('查無資料', 2.5);
    }
    this.setState({
      locations: newLocations,
    });
  }

  initializeDrugStores = () => {
    const found = this.loadFilterdDrugStore(counties[1], this.state.towns[0]);
    this.setState({
      filteredDrugStores: found,
    });
    const newLocations = [];
    found.forEach((el) => {
      el.geometry.coordinates[2] = false;
      newLocations.push(el.geometry.coordinates);
    });
    this.setState({
      locations: newLocations,
    });
  }

  loadFilterdDrugStore = (selCounty, selTown) => {
    const { drugStoresMatchedMap } = this.props;
    const found = drugStoresMatchedMap.filter((el) => {
      const { properties } = el;
      const { town, county } = properties;
      return (selCounty === county && selTown === town);
    });
    return found;
  }

  handleSearchById = (searchId) => {
    const { drugStoresMatchedMap } = this.props;
    const found = drugStoresMatchedMap.find((el) => {
      const { properties } = el;
      const { id } = properties;
      return (id === searchId);
    });
    const { geometry } = found;
    this.setState({
      locations: [[].concat(geometry.coordinates)],
      zoom: 20,
    });
  }

  handleMarkerClick = (key, childProps) => {
    const { locations } = this.state;
    const { lng, lat } = childProps;
    if (locations[key][0] !== lng && locations[key][1] !== lat) {
      return;
    }
    // eslint-disable-next-line no-param-reassign
    locations.forEach((el) => { el[2] = false; });
    const allStores = this.state.filteredDrugStores;
    const found = allStores.find((el) => {
      const { coordinates } = el.geometry;
      return coordinates[1] === lat && coordinates[0] === lng;
    });
    // open certian infoWindow
    locations[key][2] = !locations[key][2];
    this.setState({
      ...this.state,
      infoWindowContent: {
        name: found.properties.name,
        available: found.properties.available,
        open: true,
      },
    });
  }


  render() {
    const {
      Sider,
      Content,
    } = Layout;
    return (
      <Layout>
        <Sider
          width="280px"
          breakpoint="lg"
          collapsedWidth="0"
        >
          <Layout>
            <div
              style={{ height: '25vh', lineHeight: 'normal' }}
              className="layout-side-bar-header"
            >
              <Option
                towns={this.state.towns}
                loadTownsFromCounty={this.loadTownsFromCounty}
                selectedCounty={this.state.selectedCounty}
                onsubmitSearch={this.onsubmitSearch}
              />
            </div>
            <Content className="scroll" style={{ height: '80vh' }}>
              <DrugStore
                initializeDrugStores={this.initializeDrugStores}
                filteredDrugStores={this.state.filteredDrugStores}
                handleSearchById={this.handleSearchById}
              />
            </Content>
          </Layout>
        </Sider>
        <Layout>
          <Content>
            <Map
             setGoogleMaps={this.setGoogleMaps}
             locations={this.state.locations}
             zoom={this.state.zoom}
             handleMarkerClick={this.handleMarkerClick}
             infoWindowContent={this.state.infoWindowContent}
            />
          </Content>
        </Layout>
      </Layout>
    );
  }
}
const mapStateToProps = (state) => ({
  drugStoresMatchedMap: state.drugStores.list,
});

const mapDispatchToProps = (dispatch) => ({
  dispatchReceiveDrugStores: () => dispatch(dispatchReceiveDrugStores()),
});

MaskMap.propTypes = {
  dispatchReceiveDrugStores: PropTypes.func.isRequired,
  drugStoresMatchedMap: PropTypes.arrayOf(
    PropTypes.shape({
      geometry: PropTypes.object.isRequired,
      properties: PropTypes.object.isRequired,
    }).isRequired,
  ),
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MaskMap);
