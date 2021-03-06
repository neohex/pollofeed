import React from 'react';
import PropTypes from 'prop-types';
import VideoDisplay from "./VideoDisplay";
import DownloadInvoice from "./DownloadInvoice";
import {Link} from "react-router-dom";
import SocialShare from "./SocialShare";


const host = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:4321/'

const _throttle = require('lodash/throttle');


class PaymentSuccess extends React.Component {


    state = {

        estimatedVideoTime: null,
        refreshingData: false,

    }


    orderCompleteCountdownInterval = null
    orderUpdateDataInterval = null

    constructor(props) {
        super(props);
        this.startCountdown = this.startCountdown.bind(this);
        this.getOrderInfo = this.getOrderInfo.bind(this);
        this.throttledOrderInfo = _throttle(this.getOrderInfo, 1000);
    }


    componentDidMount() {

        this.orderUpdateDataInterval = setInterval(async () => {

            const {inv} = this.props;

            if (inv && !inv.complete) {

                return await Promise.all([

                    fetch(`${host}orders/id/${this.props.inv.id}`)
                        .then(response => response.json())
                        .then(order => {
                            this.props.updateInv(order);
                        }),
                    () => !inv.acknowledged && this.props.getPendingOrders()

                ])
            }


        }, 1000 * 5)
    }

    componentWillUnmount() {
        clearInterval(this.orderUpdateDataInterval);
        clearInterval(this.orderCompleteCountdownInterval)
    }

    componentDidUpdate(prevProps) {

        const {inv} = this.props;

        if (inv.acknowledged === true && prevProps.inv.acknowledged === false) {

            this.setState({
                estimatedVideoTime: 30
            }, () => {
                this.startCountdown();
            })

        }
    }

    startCountdown() {


        this.orderCompleteCountdownInterval = setInterval(() => {

            if (this.state.estimatedVideoTime > 0) {

                this.setState({
                    estimatedVideoTime: this.state.estimatedVideoTime - 1
                })
            } else {

                clearInterval(this.cd);
            }
        }, 1000)

    }

    getOrderInfo() {

        const {inv} = this.props;

        return this.setState({
            refreshingData: true,
        }, () => {
            return fetch(`${host}orders/id/${inv.id}`)
                .then(response => response.json()).then(inv => {

                    this.props.updateInv(inv);
                    return this.setState({
                        refreshingData: false
                    })
                }).catch(err => {
                    this.setState({
                        err,
                        refreshingData: false
                    })
                })

        })

    }


    render() {
        const {inv, pendingOrders, history} = this.props;

        const {estimatedVideoTime, refreshingData} = this.state;

        return (
            <div className={'w-100 h-100 container'}>

                <div className={'row my-3 d-flex justify-content-end align-items-center'}>

                    <Link to={'/'} className={'btn btn-warning'}>
                        <i className={'fa fa-home'}>
                        </i>
                    </Link>
                </div>
                <h1>
                    Thank you for the order
                    <small>
                        <button className={'btn btn-default mr-1'} onClick={this.throttledOrderInfo}>
                            <i className={refreshingData ? 'mr-1 fa fa-refresh fa-spin' : 'mr-1 fa fa-refresh'}>
                            </i>
                            Refresh Data
                        </button>
                        {inv && inv.status === 'paid' && <DownloadInvoice inv={inv}/>}
                    </small>

                </h1>

                <h5>
                    You can view your order any time and the link below
                </h5>
                <Link to={`/order/id/${inv.id}`}>
                    {window.location.origin + `/order/id/${inv.id}`}
                </Link>

                {inv && !inv.acknowledged && inv.status === 'paid' && (
                    <div>
                        <h5>Status:
                            <span className={'text-warning ml-3'}>Paid / Processing</span>
                        </h5>
                        <p>Pending orders=
                            <span className={'mx-1 text-monospace'}>{pendingOrders.length}</span>
                        </p>
                    </div>
                )}
                {inv && inv.status === 'paid' && !inv.complete && inv.acknowledged && <div>
                    {1 && (

                        <div>
                            <h5>Status:
                                <span className={'text-info ml-3'}>Feeding</span>
                            </h5>
                            <p className="small">
                                The order should take ~
                                <span
                                    className={estimatedVideoTime > 0 ? 'text-monospace mr-1' : 'text-monospace mr-1 text-warning'}>
                                  {estimatedVideoTime}
                                  </span>
                                seconds to process, and video will load in page.
                            </p>
                        </div>
                    )}
                    {inv.complete && (
                        <span className={'d-flex justify-content-between align-items-center'}>
                            <span>
                                Status:
                              <span className={'text-success'}>Complete</span>
                            </span>
                          </span>
                    )}
                </div>}
                {inv && inv.video && <div className={'row my-3'}>
                    <span className={'d-none d-md-inline ml-2'}>
                            <SocialShare
                                title={'feed chickens through automated chicken feeder, powered by bitcoin lightning payments 🐔⚡'}
                                hashtags={['#pollofeed']}
                                klass={'social-icons'}

                            />
                        </span>
                    <div className={'col mx-auto'} style={{maxWidth: '680px'}}>
                        <div className={'embed-responsive embed-responsive-4by3'}>
                            <VideoDisplay video={inv.video}/>
                        </div>
                    </div>
                </div>}

                <div className={'d-inline d-md-none'}>
                    <SocialShare
                        title={'feed chickens through automated chicken feeder, powered by bitcoin lightning payments 🐔⚡'}
                        hashtags={['#pollofeed']}
                        klass={'d-flex justify-content-center align-items-center'}
                    />
                </div>

            </div>
        );
    }
}

PaymentSuccess.propTypes = {

    inv: PropTypes.object.isRequired,
    getPendingOrders: PropTypes.func.isRequired,
    updateInv: PropTypes.func.isRequired,
    pendingOrders: PropTypes.array.isRequired,
};
PaymentSuccess.defaultProps = {};

export default PaymentSuccess;
