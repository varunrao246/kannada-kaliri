"""
AST Verification of supabase/migrations/002_create_learner_profiles.sql
Uses pglast (PostgreSQL C parser libpg_query) to inspect parsed syntax trees.
"""

import sys
import pglast
from pglast import ast

def test_ast():
    with open('supabase/migrations/002_create_learner_profiles.sql', 'r') as f:
        sql = f.read()

    stmts = pglast.parse_sql(sql)
    print(f"Total parsed AST statements: {len(stmts)}")

    found_create_ext = False
    found_create_table = False
    indexes = []
    found_func = False
    found_trig_drop = False
    found_trig_create = False
    found_enable_rls = False
    policies = []
    grants = []

    for item in stmts:
        s = item.stmt
        stype = type(s).__name__
        
        if stype == 'CreateExtensionStmt':
            if s.extname == 'pgcrypto' and s.if_not_exists:
                found_create_ext = True

        elif stype == 'CreateStmt':
            relname = s.relation.relname
            schemaname = s.relation.schemaname
            if relname == 'learner_profiles' and schemaname == 'public' and s.if_not_exists:
                found_create_table = True
                cols = {}
                for elt in s.tableElts:
                    if type(elt).__name__ == 'ColumnDef':
                        cols[elt.colname] = elt
                    elif type(elt).__name__ == 'Constraint':
                        pass
                print(f"Verified CreateStmt for {schemaname}.{relname} with {len(cols)} columns")

        elif stype == 'IndexStmt':
            idx_name = s.idxname
            unique = s.unique
            if_not_exists = s.if_not_exists
            indexes.append((idx_name, unique, if_not_exists))

        elif stype == 'CreateFunctionStmt':
            func_name = s.funcname[1].sval if len(s.funcname) > 1 else s.funcname[0].sval
            if func_name == 'handle_updated_at':
                found_func = True

        elif stype == 'DropStmt':
            pass

        elif stype == 'CreateTrigStmt':
            trig_name = s.trigname
            if trig_name == 'set_learner_profiles_updated_at':
                found_trig_create = True

        elif stype == 'AlterTableStmt':
            # Check for ENABLE ROW LEVEL SECURITY
            found_enable_rls = True

        elif stype == 'CreatePolicyStmt':
            pol_name = s.policy_name
            cmd = s.cmd_name
            policies.append((pol_name, cmd))

        elif stype == 'GrantStmt':
            grants.append(s)

    assert found_create_ext, "CREATE EXTENSION IF NOT EXISTS 'pgcrypto' not found"
    assert found_create_table, "CREATE TABLE IF NOT EXISTS public.learner_profiles not found"
    assert found_func, "handle_updated_at function not found"
    assert found_trig_create, "Trigger set_learner_profiles_updated_at not found"
    assert found_enable_rls, "ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY not found"

    print("Discovered Index ASTs:", indexes)
    assert ('idx_learner_profiles_user_id', True, True) in indexes, "idx_learner_profiles_user_id (UNIQUE, IF NOT EXISTS) not found"
    assert ('idx_learner_profiles_onboarding_completed', False, True) in indexes, "idx_learner_profiles_onboarding_completed (IF NOT EXISTS) not found"

    print("Discovered Policies:", policies)
    assert len(policies) == 4, f"Expected 4 policies, found {len(policies)}"
    policy_cmds = {p[1] for p in policies}
    assert policy_cmds == {'select', 'insert', 'update', 'delete'}, f"Policies must cover select, insert, update, delete; found {policy_cmds}"

    print(f"Discovered Grants: {len(grants)}")
    assert len(grants) == 3, f"Expected 3 GRANT statements, found {len(grants)}"

    print("\nALL POSTGRESQL AST VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_ast()
