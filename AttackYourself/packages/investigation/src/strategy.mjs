/**
 * The first *scripted* investigative strategy. It exercises the contracts and
 * real state transitions; it does not demonstrate autonomous model reasoning.
 * Strategies see frozen observations and hypotheses, not hidden fixture truth.
 */
export class MisleadingPermissionStrategy {
  /** @param {object} state */
  async next(state) {
    const hypothesis=state.hypotheses.find(x=>x.id==='hyp-effective-s3-read');
    const allow=state.observations.find(x=>x.kind==='aws.iam.identity_statement' && x.facts.effect==='Allow' && x.facts.action==='s3:GetObject');
    if(!allow) return {kind:'conclude',outcome:'inconclusive',reason:'No identity Allow observation available to evaluate'};
    if(!hypothesis) {
      return {
        kind:'hypothesise',
        reason:'An identity-based Allow suggests a possibility, not an effective-permission finding',
        hypothesis:{
          id:'hyp-effective-s3-read',
          proposition:'This Lambda execution role might be able to read objects from the designated synthetic bucket',
          status:'candidate',
          evidenceRefs:[allow.id],
          assumptions:['No applicable SCP/resource policy/permissions-boundary explicit deny','The described policy matches the request context'],
        },
      };
    }
    const scp=state.observations.find(x=>x.kind==='aws.organizations.scp_statement'&&x.facts.action==='s3:GetObject');
    if(!scp) {
      return {
        kind:'observe',
        reason:'Inspect organisational restrictions before treating the identity Allow as effective access',
        tool:'inspect_synthetic_scp',
        args:{roleArn:allow.subject,action:'s3:GetObject'},
      };
    }
    if(hypothesis.revision===1) {
      const isApplicableDeny=scp.facts.effect==='Deny'&&scp.facts.applicability==='assumed-applicable-in-fixture';
      return {
        kind:'revise',
        reason:isApplicableDeny ? 'Contradictory SCP explicit deny invalidates the candidate path under synthetic assumptions' : 'The SCP observation does not yet establish an applicable explicit deny',
        hypothesis:{
          id:hypothesis.id,
          proposition:hypothesis.proposition, // Revise the belief about the SAME falsifiable claim, not the question's wording.
          status:isApplicableDeny?'rejected':'contested',
          evidenceRefs:[allow.id,scp.id],
          assumptions:isApplicableDeny?['The synthetic SCP is applicable as declared; other AWS policy context is not evaluated']:['Effective access remains unverified'],
        },
      };
    }
    return {
      kind:'conclude',
      outcome:hypothesis.status==='rejected'?'completed':'inconclusive',
      reason:hypothesis.status==='rejected'
        ? 'The synthetic evidence falsifies the original proposed access path under stated assumptions; no real AWS access was tested'
        : 'The available observations do not establish effective access; stop rather than invent an answer',
    };
  }
}
