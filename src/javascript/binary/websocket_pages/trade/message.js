const TradingAnalysis   = require('./analysis').TradingAnalysis;
const displayCurrencies = require('./currency').displayCurrencies;
const Notifications     = require('./notifications').Notifications;
const Purchase          = require('./purchase').Purchase;
const Symbols           = require('./symbols').Symbols;
const Tick              = require('./tick').Tick;
const processActiveSymbols = require('./process').processActiveSymbols;
const processContract      = require('./process').processContract;
const forgetTradingStreams = require('./process').forgetTradingStreams;
const processTick          = require('./process').processTick;
const processProposal      = require('./process').processProposal;
const processTradingTimes  = require('./process').processTradingTimes;
const PortfolioInit   = require('../user/account/portfolio/portfolio.init');
const ProfitTableInit = require('../user/account/profit_table/profit_table.init');
const StatementInit   = require('../user/account/statement/statement.init');
const State           = require('../../base/storage').State;
const GTM             = require('../../base/gtm');
const Client          = require('../../base/client');

/*
 * This Message object process the response from server and fire
 * events based on type of response
 */
const Message = (function () {
    'use strict';

    const process = function (msg) {
        const response = JSON.parse(msg.data);
        if (!State.get('is_trading')) {
            forgetTradingStreams();
            return;
        }
        if (response) {
            const type = response.msg_type;
            if (type === 'active_symbols') {
                processActiveSymbols(response);
            } else if (type === 'contracts_for') {
                Notifications.hide('CONNECTION_ERROR');
                processContract(response);
                window.contracts_for = response;
            } else if (type === 'payout_currencies') {
                Client.set('currencies', response.payout_currencies.join(','));
                displayCurrencies();
                Symbols.getSymbols(1);
            } else if (type === 'proposal') {
                processProposal(response);
            } else if (type === 'buy') {
                Purchase.display(response);
                GTM.pushPurchaseData(response);
            } else if (type === 'tick') {
                processTick(response);
            } else if (type === 'history') {
                const digit_info = TradingAnalysis.digit_info();
                if (response.req_id === 1 || response.req_id === 2) {
                    digit_info.show_chart(response.echo_req.ticks_history, response.history.prices);
                } else                    {
                    Tick.processHistory(response);
                }
            } else if (type === 'trading_times') {
                processTradingTimes(response);
            } else if (type === 'statement') {
                StatementInit.statementHandler(response);
            } else if (type === 'profit_table') {
                ProfitTableInit.profitTableHandler(response);
            } else if (type === 'error') {
                $('.error-msg').text(response.error.message);
            } else if (type === 'portfolio') {
                PortfolioInit.updatePortfolio(response);
            } else if (type === 'proposal_open_contract') {
                PortfolioInit.updateIndicative(response);
            } else if (type === 'transaction') {
                PortfolioInit.transactionResponseHandler(response);
            }
        } else {
            console.log('some error occured');
        }
    };

    return {
        process: process,
    };
})();

module.exports = {
    Message: Message,
};
