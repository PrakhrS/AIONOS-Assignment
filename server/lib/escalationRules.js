function applyEscalationGuard(agentResponse, message) {
  const msg = message.toLowerCase();
  const response = { ...agentResponse };

  // Rule 1: Security incidents
  if (/phishing|malware|unauthorized access|suspicious email|security breach/i.test(msg)) {
    response.action = 'escalate';
    response.escalatedTo = 'IT Security';
    response.kbSource = 'KB-09';
    response.reply = 'This has been flagged as a potential security incident. Please report this to security@veridian-corp.example immediately per KB-09. Do not forward the suspicious email. ' + (response.reply || '');
    response.ruleApplied = 'security_incident';
    return response;
  }

  // Rule 2: Finance/Admin access
  if (/admin access|server access|finance.*server|expense.*account.*creat/i.test(msg)) {
    response.action = 'escalate';
    response.escalatedTo = /finance|expense/i.test(msg) ? 'Finance' : 'Server Admin';
    response.ruleApplied = 'admin_access';
    return response;
  }

  // Rule 3: Contractor VPN
  if (/contractor.*vpn|vpn.*contractor/i.test(msg)) {
    response.action = 'escalate';
    response.escalatedTo = 'Manager';
    response.kbSource = 'KB-02';
    response.reply = 'Contractor VPN access requires manager approval per KB-02. This request has been escalated to your manager.';
    response.ruleApplied = 'contractor_vpn';
    return response;
  }

  return response;
}

module.exports = { applyEscalationGuard };
